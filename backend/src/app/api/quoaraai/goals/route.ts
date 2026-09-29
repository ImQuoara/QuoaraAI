import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createGoal, listGoals } from '@/quoaraai/store';
import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function userId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !isOwnerIdentity(data.user) ? null : data.user.id;
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  try { return Response.json(await listGoals(id)); }
  catch { return Response.json({ error: 'QuoaraAi intelligence schema is not ready yet.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 8_192)) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const id = await userId();
  if (!id) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const projectId = typeof value.projectId === 'string' && UUID_REGEX.test(value.projectId) ? value.projectId : null;
  if (!title || title.length > 200) return Response.json({ error: 'Invalid goal' }, { status: 400 });
  try { return Response.json(await createGoal(id, title, projectId), { status: 201 }); }
  catch { return Response.json({ error: 'Could not create goal.' }, { status: 500 }); }
}
