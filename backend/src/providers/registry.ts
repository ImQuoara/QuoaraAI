import type { ProviderCapability, ProviderCostMode } from './contracts';

export type ProviderStatus = 'ready' | 'off' | 'needs_configuration' | 'blocked';

export type RegisteredProvider = {
  id: string;
  displayName: string;
  capability: ProviderCapability;
  costMode: ProviderCostMode;
  enabled: boolean;
  configured: boolean;
  status: ProviderStatus;
  reason: string;
  automaticFallbackAllowed: boolean;
};

function cloudflareCredentialsConfigured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
}

function cloudflareFreePolicyReady() {
  return process.env.QUOARAAI_CLOUDFLARE_FREE_ONLY === 'true'
    && process.env.QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED === 'true';
}

function provider(
  input: Omit<RegisteredProvider, 'enabled'>,
): RegisteredProvider {
  return { ...input, enabled: input.status === 'ready' };
}

export function providerRegistry(): RegisteredProvider[] {
  const cloudflareConfigured = cloudflareCredentialsConfigured();
  const cloudflareFreeReady = cloudflareFreePolicyReady();

  let chatStatus: ProviderStatus = 'off';
  let chatReason = 'Installed; activation flag is off.';
  if (process.env.QUOARAAI_CHAT_ENABLED === 'true') {
    if (process.env.QUOARAAI_CHAT_COST_MODE !== 'free_only'
        || process.env.QUOARAAI_CHAT_PROVIDER !== 'cloudflare_free') {
      chatStatus = 'blocked';
      chatReason = 'Chat is not locked to the approved Cloudflare free-only route.';
    } else if (!cloudflareFreeReady) {
      chatStatus = 'blocked';
      chatReason = 'Workers Free must be explicitly owner-confirmed before chat can activate.';
    } else if (!cloudflareConfigured) {
      chatStatus = 'needs_configuration';
      chatReason = 'Cloudflare account ID or Workers AI token is missing.';
    } else {
      chatStatus = 'ready';
      chatReason = 'Cloudflare Workers AI is configured in free-only mode with no paid fallback.';
    }
  }

  let researchStatus: ProviderStatus = 'off';
  let researchReason = 'Installed; activation flag is off.';
  if (process.env.QUOARAAI_RESEARCH_ENABLED === 'true') {
    if (process.env.QUOARAAI_RESEARCH_COST_MODE !== 'free_only') {
      researchStatus = 'blocked';
      researchReason = 'Research is not locked to the approved free-only mode.';
    } else if (!process.env.TAVILY_API_KEY) {
      researchStatus = 'needs_configuration';
      researchReason = 'Tavily API key is missing.';
    } else {
      researchStatus = 'ready';
      researchReason = 'Tavily is configured in free-only mode; requests stop when free credits are unavailable.';
    }
  }

  let imageStatus: ProviderStatus = 'off';
  let imageReason = 'Installed; activation flag is off.';
  if (process.env.QUOARAAI_IMAGE_GENERATION_ENABLED === 'true') {
    if (process.env.QUOARAAI_IMAGE_COST_MODE !== 'free_only'
        || process.env.QUOARAAI_IMAGE_PROVIDER !== 'cloudflare_free') {
      imageStatus = 'blocked';
      imageReason = 'Image generation is not locked to the approved Cloudflare free-only route.';
    } else if (!cloudflareFreeReady) {
      imageStatus = 'blocked';
      imageReason = 'Workers Free must be explicitly owner-confirmed before image generation can activate.';
    } else if (!cloudflareConfigured) {
      imageStatus = 'needs_configuration';
      imageReason = 'Cloudflare account ID or Workers AI token is missing.';
    } else if (process.env.QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED !== 'true') {
      imageStatus = 'blocked';
      imageReason = 'Device-signed owner approvals must be required before external image generation.';
    } else {
      imageStatus = 'ready';
      imageReason = 'Cloudflare image generation is configured free-only; each generation still requires an exact signed owner approval.';
    }
  }

  return [
    provider({
      id: 'cloudflare_chat_free',
      displayName: 'Cloudflare Workers AI',
      capability: 'chat',
      costMode: 'free_only',
      configured: cloudflareConfigured,
      status: chatStatus,
      reason: chatReason,
      automaticFallbackAllowed: true,
    }),
    provider({
      id: 'tavily_research_free',
      displayName: 'Tavily',
      capability: 'research',
      costMode: 'free_only',
      configured: Boolean(process.env.TAVILY_API_KEY),
      status: researchStatus,
      reason: researchReason,
      automaticFallbackAllowed: false,
    }),
    provider({
      id: 'cloudflare_image_free',
      displayName: 'Cloudflare Workers AI Image',
      capability: 'image',
      costMode: 'free_only',
      configured: cloudflareConfigured,
      status: imageStatus,
      reason: imageReason,
      automaticFallbackAllowed: true,
    }),
    provider({
      id: 'video_unconfigured',
      displayName: 'Video provider not configured',
      capability: 'video',
      costMode: 'free_only',
      configured: false,
      status: 'off',
      reason: 'Video remains disabled until the owner selects and approves a provider and cost policy.',
      automaticFallbackAllowed: false,
    }),
  ];
}

export function enabledProviders(capability: ProviderCapability) {
  return providerRegistry().filter((item) => item.capability === capability && item.enabled);
}
