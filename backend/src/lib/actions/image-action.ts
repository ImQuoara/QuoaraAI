import { createHash } from 'node:crypto';
import {
  chooseFreeImageCandidates,
  type FreeImageCandidate,
  type FreeImageMode,
} from '@/lib/cloudflare-image';

const ALLOWED_ASPECTS = new Set(['1:1', '4:3', '3:4', '16:9', '9:16']);
const ALLOWED_MODES = new Set<FreeImageMode>(['auto', 'fast', 'leonardo']);

export type PreparedImageAction = {
  prompt: string;
  aspectRatio: string;
  mode: FreeImageMode;
  candidates: FreeImageCandidate[];
  actionHash: string;
};

function canonicalImageAction(input: {
  userId: string;
  prompt: string;
  aspectRatio: string;
  mode: FreeImageMode;
  candidates: FreeImageCandidate[];
}) {
  return JSON.stringify({
    userId: input.userId,
    action: 'generate_image',
    provider: 'cloudflare_workers_ai',
    routingPolicy: 'free_only_v2',
    candidates: input.candidates,
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
    mode: input.mode,
    maxCostUsd: 0,
  });
}

export function prepareImageAction(input: {
  userId: string;
  prompt: string;
  aspectRatio: string;
  mode: FreeImageMode;
}): PreparedImageAction {
  const candidates = chooseFreeImageCandidates(input.mode, input.prompt, input.aspectRatio);
  const actionHash = createHash('sha256')
    .update(canonicalImageAction({ ...input, candidates }))
    .digest('hex');

  return { ...input, candidates, actionHash };
}

function sameCandidates(left: unknown, right: FreeImageCandidate[]) {
  if (!Array.isArray(left)) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateStoredImageAction(
  userId: string,
  payload: unknown,
): (PreparedImageAction & { approvalNonce: string; approvalExpiresAt: string }) | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;

  const prompt = typeof value.prompt === 'string' ? value.prompt : '';
  const aspectRatio = typeof value.aspect_ratio === 'string' ? value.aspect_ratio : '';
  const rawMode = typeof value.mode === 'string' ? value.mode : '';
  const mode = ALLOWED_MODES.has(rawMode as FreeImageMode) ? rawMode as FreeImageMode : null;
  const approvalNonce = typeof value.approval_nonce === 'string' ? value.approval_nonce : '';
  const storedHash = typeof value.action_hash === 'string' ? value.action_hash : '';
  const approvalExpiresAt = typeof value.approval_expires_at === 'string' ? value.approval_expires_at : '';

  if (!prompt || prompt.length > 2048 || !ALLOWED_ASPECTS.has(aspectRatio) || !mode || !approvalNonce || !storedHash || !approvalExpiresAt || !Number.isFinite(Date.parse(approvalExpiresAt))) {
    return null;
  }
  if (value.provider !== 'cloudflare_workers_ai' || value.routing_policy !== 'free_only_v2' || Number(value.max_cost_usd) !== 0) {
    return null;
  }

  const prepared = prepareImageAction({ userId, prompt, aspectRatio, mode });
  if (prepared.actionHash !== storedHash || !sameCandidates(value.candidates, prepared.candidates)) return null;

  return { ...prepared, approvalNonce, approvalExpiresAt };
}
