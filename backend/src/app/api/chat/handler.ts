import { MAX_ASSISTANT_LENGTH } from '@/ai/limits';
import type { AIProvider, ChatMessage, ChatRole } from '@/ai/provider';
import { isCodingRequest, withCodingContext } from '@/quoaraai/coding';

export const MAX_MESSAGE_LENGTH = 10_000;
export const MAX_HISTORY_MESSAGES = 50;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ChatDeps {
  ai: AIProvider;
  getUser(): Promise<{ id: string } | null>;
  ownsConversation(userId: string, conversationId: string): Promise<boolean>;
  consumeRateLimit(userId: string): Promise<boolean>;
  insertMessage(conversationId: string, role: ChatRole, content: string): Promise<void>;
  listMessages(conversationId: string, limit: number): Promise<ChatMessage[]>;
  recordLearningCandidate?(userId: string, conversationId: string, request: string, response: string): Promise<void>;
}

export function parseChatBody(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const conversationId = record.conversationId;
  const message = record.message;

  if (typeof conversationId !== 'string' || !UUID_REGEX.test(conversationId)) return null;
  if (typeof message !== 'string') return null;

  const content = message.trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) return null;

  return { conversationId, message: content };
}

function clipByCodePoint(text: string, remaining: number) {
  if (remaining <= 0) return { text: '', count: 0, capped: text.length > 0 };

  const points = Array.from(text);
  if (points.length <= remaining) {
    return { text, count: points.length, capped: false };
  }

  return {
    text: points.slice(0, remaining).join(''),
    count: remaining,
    capped: true,
  };
}

export function createChatPostHandler(deps: ChatDeps) {
  return async function POST(request: Request) {
    const user = await deps.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const parsed = parseChatBody(body);
    if (!parsed) return Response.json({ error: 'Invalid request' }, { status: 400 });

    const { conversationId, message } = parsed;

    if (!(await deps.ownsConversation(userId, conversationId))) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!(await deps.consumeRateLimit(userId))) {
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const history = await deps.listMessages(conversationId, MAX_HISTORY_MESSAGES);
    const providerHistory = withCodingContext(
      [...history, { role: 'user', content: message }],
      message,
    );

    let upstream: ReadableStream<Uint8Array>;
    try {
      upstream = await deps.ai.streamChat(providerHistory);
    } catch (error) {
      console.error('Chat provider startup failed:', error);
      return Response.json(
        { error: 'Chat provider is unavailable in approved free-only mode. No paid fallback was attempted.' },
        { status: 503 },
      );
    }

    // Persist only after a provider stream has actually started. This avoids
    // leaving a dangling user message when provider configuration/quota fails.
    await deps.insertMessage(conversationId, 'user', message);

    const reader = upstream.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let fullResponse = '';
    let assistantCharacters = 0;
    let persisted = false;

    async function persistAssistant() {
      if (persisted) return;
      persisted = true;
      if (fullResponse.length > 0) {
        await deps.insertMessage(conversationId, 'assistant', fullResponse);
        if (deps.recordLearningCandidate && isCodingRequest(message)) {
          await deps.recordLearningCandidate(userId, conversationId, message, fullResponse);
        }
      }
    }

    function enqueueText(
      text: string,
      controller: ReadableStreamDefaultController<Uint8Array>,
    ) {
      const remaining = MAX_ASSISTANT_LENGTH - assistantCharacters;
      const clipped = clipByCodePoint(text, remaining);

      if (clipped.text) {
        fullResponse += clipped.text;
        assistantCharacters += clipped.count;
        controller.enqueue(encoder.encode(clipped.text));
      }

      return clipped.capped || assistantCharacters >= MAX_ASSISTANT_LENGTH;
    }

    const output = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();

          if (done) {
            const tail = decoder.decode();
            if (tail) enqueueText(tail, controller);
            await persistAssistant();
            controller.close();
            return;
          }

          if (!value) return;

          const text = decoder.decode(value, { stream: true });
          const reachedLimit = text ? enqueueText(text, controller) : false;

          if (reachedLimit) {
            await persistAssistant();
            try {
              await reader.cancel('assistant_output_limit');
            } catch {
              // The output is already capped and persisted; upstream cancellation is best-effort.
            }
            controller.close();
          }
        } catch (error) {
          await persistAssistant();
          controller.error(error);
        }
      },
      async cancel(reason) {
        await persistAssistant();
        await reader.cancel(reason);
      },
    });

    return new Response(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  };
}
