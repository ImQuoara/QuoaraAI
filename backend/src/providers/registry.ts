import type { ProviderCapability, ProviderCostMode } from './contracts';

export type RegisteredProvider = {
  id: string;
  displayName: string;
  capability: ProviderCapability;
  costMode: ProviderCostMode;
  enabled: boolean;
  automaticFallbackAllowed: boolean;
};

export function providerRegistry(): RegisteredProvider[] {
  return [
    {
      id: 'cloudflare_chat_free',
      displayName: 'Cloudflare Workers AI',
      capability: 'chat',
      costMode: 'free_only',
      enabled: process.env.QUOARAAI_CHAT_ENABLED === 'true' && process.env.QUOARAAI_CHAT_COST_MODE === 'free_only',
      automaticFallbackAllowed: true,
    },
    {
      id: 'tavily_research_free',
      displayName: 'Tavily',
      capability: 'research',
      costMode: 'free_only',
      enabled: process.env.QUOARAAI_RESEARCH_ENABLED === 'true' && process.env.QUOARAAI_RESEARCH_COST_MODE === 'free_only',
      automaticFallbackAllowed: false,
    },
    {
      id: 'cloudflare_image_free',
      displayName: 'Cloudflare Workers AI Image',
      capability: 'image',
      costMode: 'free_only',
      enabled: process.env.QUOARAAI_IMAGE_GENERATION_ENABLED === 'true' && process.env.QUOARAAI_IMAGE_COST_MODE === 'free_only',
      automaticFallbackAllowed: true,
    },
    {
      id: 'video_unconfigured',
      displayName: 'Video provider not configured',
      capability: 'video',
      costMode: 'free_only',
      enabled: false,
      automaticFallbackAllowed: false,
    },
  ];
}

export function enabledProviders(capability: ProviderCapability) {
  return providerRegistry().filter((provider) => provider.capability === capability && provider.enabled);
}
