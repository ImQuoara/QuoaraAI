import type { AIProvider } from './provider';
import { CloudflareFreeProvider } from './providers/cloudflare';
import { GeminiProvider } from './providers/gemini';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const selected = (process.env.QUOARAAI_CHAT_PROVIDER || 'cloudflare_free').toLowerCase();
  if (selected === 'cloudflare_free') {
    provider = new CloudflareFreeProvider();
    return provider;
  }

  if (selected === 'gemini') {
    provider = new GeminiProvider();
    return provider;
  }

  throw new Error(`Unsupported QUOARAAI_CHAT_PROVIDER: ${selected}`);
}
