import { validateStoredImageAction } from '@/lib/actions/image-action';
import { buildApprovalChallenge, verifyP256Signature } from '@/lib/security/device-approval';
import { generateFreeCloudflareImage } from '@/lib/cloudflare-image';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 8_192)) return Response.json({ error: 'Request too large.' }, { status: 413 });

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  if (process.env.QUOARAAI_IMAGE_GENERATION_ENABLED !== 'true'
      || process.env.QUOARAAI_IMAGE_COST_MODE !== 'free_only'
      || process.env.QUOARAAI_IMAGE_PROVIDER !== 'cloudflare_free') {
    return Response.json({ error: 'Free-only image generation is not activated.' }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }

  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const actionRequestId = typeof value.actionRequestId === 'string' ? value.actionRequestId : '';
  if (!UUID_REGEX.test(actionRequestId)) return Response.json({ error: 'Invalid approval reference.' }, { status: 400 });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Atomic single-use claim of one owner-approved, zero-dollar external action.
  const { data: action, error: claimError } = await admin
    .from('owner_action_requests')
    .update({ status: 'executed', executed_at: now })
    .eq('id', actionRequestId)
    .eq('user_id', data.user.id)
    .eq('kind', 'external_action')
    .eq('status', 'approved')
    .eq('estimated_cost_usd', 0)
    .gt('expires_at', now)
    .select('id,payload,estimated_cost_usd,expires_at,approved_device_key_id,approval_signature_b64')
    .maybeSingle();

  if (claimError || !action) {
    return Response.json({ error: 'Approval is missing, expired, already used, or not a zero-dollar owner action.' }, { status: 428 });
  }

  const prepared = validateStoredImageAction(data.user.id, action.payload);
  const approvedDeviceKeyId = typeof action.approved_device_key_id === 'string' ? action.approved_device_key_id : '';
  const approvalSignature = typeof action.approval_signature_b64 === 'string' ? action.approval_signature_b64 : '';
  const expiresAt = typeof action.expires_at === 'string' ? action.expires_at : '';

  if (!prepared || !approvedDeviceKeyId || !approvalSignature || !expiresAt) {
    await admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId);
    return Response.json({ error: 'Approved action is not bound to a valid signed payload. No provider call was made.' }, { status: 409 });
  }


  const rowExpiryMs = Date.parse(expiresAt);
  const signedExpiryMs = Date.parse(prepared.approvalExpiresAt);
  if (!Number.isFinite(rowExpiryMs) || !Number.isFinite(signedExpiryMs) || rowExpiryMs !== signedExpiryMs) {
    await admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId);
    return Response.json({ error: 'Approved action expiry binding is invalid. No provider call was made.' }, { status: 409 });
  }

  const { data: device, error: deviceError } = await admin
    .from('owner_devices')
    .select('public_key_spki_b64,status')
    .eq('user_id', data.user.id)
    .eq('device_key_id', approvedDeviceKeyId)
    .eq('status', 'active')
    .maybeSingle();

  if (deviceError || !device) {
    await admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId);
    return Response.json({ error: 'Approving owner device is unavailable or revoked. No provider call was made.' }, { status: 403 });
  }

  const challenge = buildApprovalChallenge({
    actionRequestId,
    actionHash: prepared.actionHash,
    expiresAt: prepared.approvalExpiresAt,
    nonce: prepared.approvalNonce,
  });
  if (!verifyP256Signature(device.public_key_spki_b64, challenge, approvalSignature)) {
    await admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId);
    return Response.json({ error: 'Stored owner approval no longer verifies. No provider call was made.' }, { status: 403 });
  }

  const { prompt, actionHash, candidates } = prepared;
  const provider = 'cloudflare_workers_ai';
  const routingPolicy = 'free_only_v2';

  const { error: startLedgerError } = await admin.from('owner_action_ledger').insert({
    user_id: data.user.id,
    action_request_id: actionRequestId,
    action_type: 'generate_image',
    summary: 'Claimed approved free-tier image action for single execution.',
    status: 'executed',
    metadata: { action_hash: actionHash, provider, routing_policy: routingPolicy, candidates, phase: 'provider_call_started' },
  });

  if (startLedgerError) {
    await admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId);
    return Response.json({ error: 'Audit ledger is unavailable. No provider call was made.' }, { status: 503 });
  }

  try {
    const generated = await generateFreeCloudflareImage(prompt, candidates);

    await Promise.all([
      admin.from('owner_action_ledger').insert({
        user_id: data.user.id,
        action_request_id: actionRequestId,
        action_type: 'generate_image',
        summary: 'Free-tier image generation completed.',
        status: 'executed',
        metadata: {
          action_hash: actionHash,
          provider,
          model: generated.model,
          estimated_neurons: generated.estimatedNeurons,
          phase: 'provider_call_completed',
        },
      }),
      admin.from('owner_cost_events').insert({
        user_id: data.user.id,
        provider: 'cloudflare_workers_ai',
        model: generated.model,
        operation: 'image_generation_free_allocation',
        input_units: Math.ceil(generated.estimatedNeurons),
        estimated_cost_usd: 0,
        actual_cost_usd: null,
      }),
    ]);

    return Response.json({
      dataUrl: generated.dataUrl,
      model: generated.model,
      provider: 'Cloudflare Workers AI Free',
      estimatedCostUsd: 0,
      estimatedNeurons: generated.estimatedNeurons,
      actionHash,
    });
  } catch (error) {
    console.error('Free image generation error:', error);
    await Promise.allSettled([
      admin.from('owner_action_requests').update({ status: 'failed' }).eq('id', actionRequestId),
      admin.from('owner_action_ledger').insert({
        user_id: data.user.id,
        action_request_id: actionRequestId,
        action_type: 'generate_image',
        summary: 'Free-tier image generation failed.',
        status: 'failed',
        metadata: { action_hash: actionHash, provider, candidates },
      }),
    ]);
    return Response.json({ error: 'Free image allowance/provider is unavailable. QuoaraAi did not attempt a paid fallback.' }, { status: 429 });
  }
}
