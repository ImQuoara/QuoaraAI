import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createProject, listProjects } from '@/quoaraai/store';
import { createClient } from '@/lib/supabase/server';

async function userId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !isOwnerIdentity(data.user) ? null : data.user.id;
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  try { return Response.json(await listProjects(id)); }
  catch { return Response.json({ error: 'QuoaraAi intelligence schema is not ready yet.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 16_384)) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const id = await userId();
  if (!id) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  if (!name || name.length > 120 || description.length > 4000) return Response.json({ error: 'Invalid project' }, { status: 400 });
  try { return Response.json(await createProject(id, name, description), { status: 201 }); }
  catch { return Response.json({ error: 'Could not create project.' }, { status: 500 }); }
}
