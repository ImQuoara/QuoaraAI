import { buildApprovalChallenge, createApprovalNonce } from '@/lib/security/device-approval';
import { prepareImageAction } from '@/lib/actions/image-action';
import type { FreeImageMode } from '@/lib/cloudflare-image';
import { evaluateMediaPrompt } from '@/lib/content/policy';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_ASPECTS = new Set(['1:1', '4:3', '3:4', '16:9', '9:16']);
const ALLOWED_MODES = new Set<FreeImageMode>(['auto', 'fast', 'leonardo']);

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 24_576)) return Response.json({ error: 'Request too large.' }, { status: 413 });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  if (process.env.QUOARAAI_IMAGE_GENERATION_ENABLED !== 'true') {
    return Response.json({ error: 'Image generation is installed but not activated.' }, { status: 503 });
  }
  if (process.env.QUOARAAI_IMAGE_COST_MODE !== 'free_only') {
    return Response.json({ error: 'Only the approved free-only image route is enabled in this alpha.' }, { status: 503 });
  }
  if (process.env.QUOARAAI_IMAGE_PROVIDER !== 'cloudflare_free') {
    return Response.json({ error: 'Paid image providers are disabled.' }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }

  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
  const aspectRatio = typeof value.aspectRatio === 'string' ? value.aspectRatio : '1:1';
  const requestedMode = typeof value.mode === 'string' ? value.mode : 'auto';
  const mode = ALLOWED_MODES.has(requestedMode as FreeImageMode) ? requestedMode as FreeImageMode : 'auto';

  if (!prompt || prompt.length > 2048 || !ALLOWED_ASPECTS.has(aspectRatio)) {
    return Response.json({ error: 'Invalid image request.' }, { status: 400 });
  }

  const policy = evaluateMediaPrompt(prompt);
  if (!policy.allowed) {
    return Response.json({ error: policy.reason ?? 'Prompt not allowed.', policy: policy.code }, { status: 400 });
  }

  const prepared = prepareImageAction({ userId: data.user.id, prompt, aspectRatio, mode });
  const { candidates, actionHash } = prepared;
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const approvalNonce = createApprovalNonce();

  const { data: actionRequest, error: insertError } = await admin
    .from('owner_action_requests')
    .insert({
      user_id: data.user.id,
      kind: 'external_action',
      title: 'Generate free-tier image',
      description: 'Pending owner approval for one exact free-tier image generation request.',
      risk: 'low',
      reversible: false,
      payload: {
        action_hash: actionHash,
        provider: 'cloudflare_workers_ai',
        routing_policy: 'free_only_v2',
        candidates,
        prompt,
        aspect_ratio: aspectRatio,
        mode,
        max_cost_usd: 0,
        approval_nonce: approvalNonce,
        approval_expires_at: expiresAt,
      },
      estimated_cost_usd: 0,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id,estimated_cost_usd,expires_at')
    .single();

  if (insertError || !actionRequest) {
    console.error('Image prepare ledger error:', insertError);
    return Response.json({ error: 'Approval ledger is unavailable. No provider call was made.' }, { status: 503 });
  }

  const { error: ledgerError } = await admin.from('owner_action_ledger').insert({
    user_id: data.user.id,
    action_request_id: actionRequest.id,
    action_type: 'generate_image',
    summary: 'Prepared exact free-tier image generation for owner review.',
    status: 'proposed',
    metadata: {
      action_hash: actionHash,
      provider: 'cloudflare_workers_ai',
      routing_policy: 'free_only_v2',
      candidates,
      estimated_cost_usd: 0,
    },
  });

  if (ledgerError) {
    await admin.from('owner_action_requests').update({ status: 'cancelled' }).eq('id', actionRequest.id);
    return Response.json({ error: 'Audit ledger is unavailable. No provider call was made.' }, { status: 503 });
  }

  const approvalChallenge = buildApprovalChallenge({
    actionRequestId: actionRequest.id,
    actionHash,
    expiresAt,
    nonce: approvalNonce,
  });

  return Response.json({
    actionRequestId: actionRequest.id,
    approvalChallenge,
    estimatedCostUsd: 0,
    provider: 'Cloudflare Workers AI Free',
    models: candidates.map((candidate) => candidate.model),
    primaryModel: candidates[0]?.model,
    mode,
    expiresAt,
    actionHash,
  });
}
