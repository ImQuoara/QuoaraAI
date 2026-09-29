import assert from 'node:assert/strict';
import test from 'node:test';
import { providerRegistry } from '../src/providers/registry';

const KEYS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'QUOARAAI_CLOUDFLARE_FREE_ONLY',
  'QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED',
  'QUOARAAI_CHAT_ENABLED',
  'QUOARAAI_CHAT_COST_MODE',
  'QUOARAAI_CHAT_PROVIDER',
  'TAVILY_API_KEY',
  'QUOARAAI_RESEARCH_ENABLED',
  'QUOARAAI_RESEARCH_COST_MODE',
  'QUOARAAI_IMAGE_GENERATION_ENABLED',
  'QUOARAAI_IMAGE_COST_MODE',
  'QUOARAAI_IMAGE_PROVIDER',
  'QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED',
] as const;

function withEnv(values: Partial<Record<(typeof KEYS)[number], string>>, fn: () => void) {
  const snapshot = new Map<string, string | undefined>();
  for (const key of KEYS) {
    snapshot.set(key, process.env[key]);
    delete process.env[key];
  }
  Object.assign(process.env, values);
  try {
    fn();
  } finally {
    for (const key of KEYS) {
      const value = snapshot.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('provider registry fails closed when feature flags are on without credentials', () => {
  withEnv({
    QUOARAAI_CHAT_ENABLED: 'true',
    QUOARAAI_CHAT_COST_MODE: 'free_only',
    QUOARAAI_CHAT_PROVIDER: 'cloudflare_free',
    QUOARAAI_CLOUDFLARE_FREE_ONLY: 'true',
    QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED: 'true',
    QUOARAAI_RESEARCH_ENABLED: 'true',
    QUOARAAI_RESEARCH_COST_MODE: 'free_only',
  }, () => {
    const registry = providerRegistry();
    assert.equal(registry.find((x) => x.capability === 'chat')?.status, 'needs_configuration');
    assert.equal(registry.find((x) => x.capability === 'research')?.status, 'needs_configuration');
    assert.equal(registry.find((x) => x.capability === 'chat')?.enabled, false);
  });
});

test('chat and research become ready only with complete free-only configuration', () => {
  withEnv({
    CLOUDFLARE_ACCOUNT_ID: 'account',
    CLOUDFLARE_API_TOKEN: 'token',
    QUOARAAI_CLOUDFLARE_FREE_ONLY: 'true',
    QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED: 'true',
    QUOARAAI_CHAT_ENABLED: 'true',
    QUOARAAI_CHAT_COST_MODE: 'free_only',
    QUOARAAI_CHAT_PROVIDER: 'cloudflare_free',
    TAVILY_API_KEY: 'tvly-test',
    QUOARAAI_RESEARCH_ENABLED: 'true',
    QUOARAAI_RESEARCH_COST_MODE: 'free_only',
  }, () => {
    const registry = providerRegistry();
    assert.equal(registry.find((x) => x.capability === 'chat')?.status, 'ready');
    assert.equal(registry.find((x) => x.capability === 'research')?.status, 'ready');
  });
});

test('image generation stays blocked until device-signed approvals are required', () => {
  withEnv({
    CLOUDFLARE_ACCOUNT_ID: 'account',
    CLOUDFLARE_API_TOKEN: 'token',
    QUOARAAI_CLOUDFLARE_FREE_ONLY: 'true',
    QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED: 'true',
    QUOARAAI_IMAGE_GENERATION_ENABLED: 'true',
    QUOARAAI_IMAGE_COST_MODE: 'free_only',
    QUOARAAI_IMAGE_PROVIDER: 'cloudflare_free',
    QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED: 'false',
  }, () => {
    const image = providerRegistry().find((x) => x.capability === 'image');
    assert.equal(image?.status, 'blocked');
    assert.equal(image?.enabled, false);
  });
});
