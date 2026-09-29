import type { AIProvider, ChatMessage } from '../provider';

const DEFAULT_MODELS = [
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/google/gemma-4-26b-a4b-it',
  '@cf/openai/gpt-oss-20b',
];

function modelCandidates() {
  const configured = (process.env.CLOUDFLARE_CHAT_MODELS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_MODELS;
}

function requireFreeCloudflareConfig() {
  if (process.env.QUOARAAI_CLOUDFLARE_FREE_ONLY !== 'true') {
    throw new Error('Cloudflare provider is not locked to free-only mode.');
  }
  if (process.env.QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED !== 'true') {
    throw new Error('Cloudflare Workers Free plan has not been owner-confirmed.');
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) throw new Error('Cloudflare Workers AI credentials are not configured.');
  return { accountId, apiToken };
}

type CloudflareChatResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  error?: { message?: unknown };
};

export class CloudflareFreeProvider implements AIProvider {
  private async complete(messages: ChatMessage[]) {
    const { accountId, apiToken } = requireFreeCloudflareConfig();
    const maxTokensRaw = Number(process.env.QUOARAAI_CHAT_MAX_OUTPUT_TOKENS ?? 2048);
    const maxTokens = Number.isFinite(maxTokensRaw) ? Math.max(128, Math.min(4096, Math.floor(maxTokensRaw))) : 2048;
    const errors: string[] = [];

    for (const model of modelCandidates()) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: maxTokens,
              stream: false,
              options: { rejectIfBusy: true },
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(45_000),
          },
        );

        const raw = await response.json().catch(() => null) as CloudflareChatResponse | null;
        if (!response.ok) {
          const providerMessage = typeof raw?.error?.message === 'string' ? raw.error.message : `HTTP ${response.status}`;
          errors.push(`${model}: ${providerMessage}`);
          // Free-only routing may try another explicitly approved free Workers AI model.
          // It never switches to a third-party paid model or unified-billing route.
          if ([403, 408, 429, 500, 502, 503, 504].includes(response.status)) continue;
          throw new Error(`Cloudflare Workers AI request failed: ${providerMessage}`);
        }

        const content = raw?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          errors.push(`${model}: empty response`);
          continue;
        }
        return content;
      } catch (error) {
        errors.push(`${model}: ${error instanceof Error ? error.message : 'request failed'}`);
      }
    }

    throw new Error(`All approved free chat models were unavailable. ${errors.join(' | ')}`);
  }

  async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
    const text = await this.complete(messages);
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    return this.complete(messages);
  }
}
