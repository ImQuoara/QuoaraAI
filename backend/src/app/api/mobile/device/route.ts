import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildDeviceRegistrationChallenge, deviceKeyId, verifyP256Signature } from '@/lib/security/device-approval';

const KEY_ID = /^[0-9a-f]{64}$/i;

async function owner() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) return null;
  return data.user;
}

export async function GET(request: Request) {
  const user = await owner();
  if (!user) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  const keyId = new URL(request.url).searchParams.get('keyId') ?? '';
  if (!KEY_ID.test(keyId)) return Response.json({ error: 'Invalid device key.' }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from('owner_devices')
    .select('device_key_id,status,created_at,last_seen_at')
    .eq('user_id', user.id)
    .eq('device_key_id', keyId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return Response.json({ error: 'Owner device registry is not ready.' }, { status: 503 });
  return Response.json({ registered: Boolean(data), device: data ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 24_576)) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const user = await owner();
  if (!user) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const keyId = typeof value.deviceKeyId === 'string' ? value.deviceKeyId : '';
  const publicKey = typeof value.publicKeySpkiB64 === 'string' ? value.publicKeySpkiB64 : '';
  const signature = typeof value.signatureB64 === 'string' ? value.signatureB64 : '';
  const label = typeof value.label === 'string' ? value.label.trim().slice(0, 120) : 'Android Owner Device';
  const timestampMs = typeof value.timestampMs === 'number' ? value.timestampMs : NaN;

  if (!KEY_ID.test(keyId) || !publicKey || publicKey.length > 2048 || !signature || !Number.isSafeInteger(timestampMs)) {
    return Response.json({ error: 'Invalid device registration.' }, { status: 400 });
  }
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return Response.json({ error: 'Device registration proof expired.' }, { status: 400 });
  }
  if (deviceKeyId(publicKey) !== keyId) return Response.json({ error: 'Device key fingerprint mismatch.' }, { status: 400 });

  const challenge = buildDeviceRegistrationChallenge(keyId, timestampMs);
  if (!verifyP256Signature(publicKey, challenge, signature)) {
    return Response.json({ error: 'Device proof signature is invalid.' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin.rpc('register_owner_device', {
    p_user_id: user.id,
    p_device_key_id: keyId,
    p_public_key_spki_b64: publicKey,
    p_label: label || 'Android Owner Device',
  });

  if (error) return Response.json({ error: 'Owner device registry is not ready.' }, { status: 503 });
  const device = Array.isArray(rows) ? rows[0] : null;
  if (!device) {
    return Response.json({ error: 'This device key is revoked and cannot reactivate itself.' }, { status: 409 });
  }
  return Response.json({ registered: true, device }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
