import type { AIProvider } from './provider';
import { CloudflareFreeProvider } from './providers/cloudflare';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const selected = (process.env.QUOARAAI_CHAT_PROVIDER || 'cloudflare_free').toLowerCase();
  if (selected !== 'cloudflare_free') {
    throw new Error(`Unsupported QUOARAAI_CHAT_PROVIDER: ${selected}`);
  }

  provider = new CloudflareFreeProvider();
  return provider;
}
