import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildApprovalChallenge, verifyP256Signature } from '@/lib/security/device-approval';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY_ID = /^[0-9a-f]{64}$/i;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 12_288)) return Response.json({ error: 'Request too large.' }, { status: 413 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !isOwnerIdentity(auth.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const id = typeof value.id === 'string' ? value.id : '';
  const keyId = typeof value.deviceKeyId === 'string' ? value.deviceKeyId : '';
  const signature = typeof value.signatureB64 === 'string' ? value.signatureB64 : '';
  if (!UUID.test(id) || !KEY_ID.test(keyId) || !signature || signature.length > 2048) {
    return Response.json({ error: 'Invalid signed approval.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: action, error: actionError }, { data: device, error: deviceError }] = await Promise.all([
    admin.from('owner_action_requests')
      .select('id,kind,title,risk,reversible,payload,estimated_cost_usd,status,expires_at')
      .eq('id', id).eq('user_id', auth.user.id).eq('status', 'pending').maybeSingle(),
    admin.from('owner_devices')
      .select('device_key_id,public_key_spki_b64,status')
      .eq('user_id', auth.user.id).eq('device_key_id', keyId).eq('status', 'active').maybeSingle(),
  ]);

  if (actionError || deviceError) return Response.json({ error: 'Signed approval registry is unavailable.' }, { status: 503 });
  if (!action || !device) return Response.json({ error: 'Pending action or registered owner device not found.' }, { status: 404 });
  const expiresAtMs = typeof action.expires_at === 'string' ? Date.parse(action.expires_at) : NaN;
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return Response.json({ error: 'Action approval expired.' }, { status: 410 });
  if (Number(action.estimated_cost_usd ?? 0) !== 0) {
    return Response.json({ error: 'This mobile fast-path only approves actions with a $0 provider-cost ceiling.' }, { status: 402 });
  }

  const payload = action.payload && typeof action.payload === 'object' ? action.payload as Record<string, unknown> : {};
  const actionHash = typeof payload.action_hash === 'string' ? payload.action_hash : '';
  const nonce = typeof payload.approval_nonce === 'string' ? payload.approval_nonce : '';
  const approvalExpiresAt = typeof payload.approval_expires_at === 'string' ? payload.approval_expires_at : '';
  const approvalExpiresAtMs = Date.parse(approvalExpiresAt);
  if (!actionHash || !nonce || !approvalExpiresAt || !Number.isFinite(approvalExpiresAtMs)) {
    return Response.json({ error: 'Action does not contain a device-signable challenge.' }, { status: 409 });
  }
  if (approvalExpiresAtMs !== expiresAtMs) {
    return Response.json({ error: 'Action approval expiry binding is invalid.' }, { status: 409 });
  }

  const challenge = buildApprovalChallenge({ actionRequestId: id, actionHash, expiresAt: approvalExpiresAt, nonce });
  if (!verifyP256Signature(device.public_key_spki_b64, challenge, signature)) {
    return Response.json({ error: 'Owner device signature is invalid.' }, { status: 403 });
  }

  const { data: approvedRows, error: approveError } = await admin.rpc('approve_owner_action_request', {
    p_user_id: auth.user.id,
    p_action_request_id: id,
    p_device_key_id: keyId,
    p_signature_b64: signature,
    p_action_hash: actionHash,
  });

  if (approveError) return Response.json({ error: 'Could not atomically record signed approval.' }, { status: 503 });
  const approved = Array.isArray(approvedRows) ? approvedRows[0] : null;
  if (!approved) return Response.json({ error: 'Action was already decided, expired, changed, or is not zero-dollar.' }, { status: 409 });

  const { error: seenError } = await admin.from('owner_devices')
    .update({ last_seen_at: now })
    .eq('user_id', auth.user.id)
    .eq('device_key_id', keyId);
  if (seenError) console.error('Owner device last_seen update failed:', seenError);

  return Response.json(approved, { headers: { 'Cache-Control': 'no-store' } });
}
