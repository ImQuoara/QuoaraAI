import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createClient } from '@/lib/supabase/server';
import { createConversationHandlers } from './handler';

async function deps() {
  const supabase = await createClient();

  return {
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      return error || !isOwnerIdentity(data.user) ? null : { id: data.user.id };
    },
    async list(userId: string) {
      const { data, error } = await supabase
        .from('conversations')
        .select('id,title,created_at,updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    async create(userId: string, title: string) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title })
        .select('id,title,created_at,updated_at')
        .single();
      if (error) throw error;
      return data;
    },
  };
}

export async function GET() {
  try {
    const handlers = createConversationHandlers(await deps());
    return handlers.GET();
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
    if (bodyTooLarge(request, 8_192)) return Response.json({ error: 'Request too large.' }, { status: 413 });
    const handlers = createConversationHandlers(await deps());
    return handlers.POST(request);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
