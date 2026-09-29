import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { decideActionRequest } from '@/quoaraai/store';
import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 8_192)) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid request' }, { status: 400 });
  const value = body as Record<string, unknown>;
  if (typeof value.id !== 'string' || !UUID_REGEX.test(value.id)) return Response.json({ error: 'Invalid action id' }, { status: 400 });
  if (value.decision !== 'approved' && value.decision !== 'rejected') return Response.json({ error: 'Invalid decision' }, { status: 400 });
  if (value.decision === 'approved' && process.env.QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED === 'true') {
    return Response.json({ error: 'Owner device signature required. Approve from the QuoaraAi Android client.' }, { status: 428 });
  }

  try {
    const result = await decideActionRequest(data.user.id, value.id, value.decision);
    if (!result) return Response.json({ error: 'Pending action not found' }, { status: 404 });
    return Response.json(result);
  } catch (err) {
    console.error('QuoaraAi action decision error:', err);
    return Response.json({ error: 'Could not update action decision.' }, { status: 500 });
  }
}
