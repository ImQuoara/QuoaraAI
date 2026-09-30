import { getAIProvider } from '@/ai';
import type { ChatMessage } from '@/ai/provider';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createChatPostHandler } from './handler';

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
    if (bodyTooLarge(request, 32_768)) return Response.json({ error: 'Request too large.' }, { status: 413 });
    if (process.env.QUOARAAI_CHAT_ENABLED !== 'true') return Response.json({ error: 'Chat provider is installed but not activated.' }, { status: 503 });
    if (process.env.QUOARAAI_CHAT_COST_MODE !== 'free_only') return Response.json({ error: 'Paid chat mode is disabled until an exact cost-approval flow is enabled.' }, { status: 503 });
    if (process.env.QUOARAAI_CHAT_PROVIDER !== 'cloudflare_free') return Response.json({ error: 'Chat provider is not pinned to cloudflare_free.' }, { status: 503 });

    const supabase = await createClient();
    let adminClient: ReturnType<typeof createAdminClient> | null = null;
    const admin = () => {
      if (!adminClient) adminClient = createAdminClient();
      return adminClient;
    };

    const handler = createChatPostHandler({
      ai: getAIProvider(),

      async getUser() {
        const { data, error } = await supabase.auth.getUser();
        return error || !isOwnerIdentity(data.user) ? null : { id: data.user.id };
      },

      async ownsConversation(userId, conversationId) {
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .maybeSingle();
        return !error && Boolean(data);
      },

      async consumeRateLimit(userId) {
        const { data, error } = await admin().rpc('consume_chat_rate_limit', {
          p_user_id: userId,
        });
        if (error) throw error;
        return data === true;
      },

      async insertMessage(conversationId, role, content) {
        const { error } = await admin()
          .from('messages')
          .insert({ conversation_id: conversationId, role, content });
        if (error) throw error;
      },

      async listMessages(conversationId, limit): Promise<ChatMessage[]> {
        const { data, error } = await supabase
          .from('messages')
          .select('role,content,created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return (data ?? [])
          .reverse()
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map((message) => ({
            role: message.role as ChatMessage['role'],
            content: message.content,
          }));
      },

      async recordLearningCandidate(userId, conversationId, requestText, responseText) {
        const { error } = await admin()
          .from('quoaraai_learning_candidates')
          .insert({
            user_id: userId,
            project_id: null,
            kind: 'skill',
            payload: {
              domain: 'coding',
              conversation_id: conversationId,
              request_excerpt: requestText.slice(0, 4000),
              response_excerpt: responseText.slice(0, 8000),
              source: 'chat_coding_session',
            },
            rationale: 'Captured from an owner coding conversation for later review and skill promotion. This candidate is not automatically activated.',
            status: 'pending',
          });
        if (error) console.error('Could not record coding learning candidate:', error);
      },
    });

    return handler(request);
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
