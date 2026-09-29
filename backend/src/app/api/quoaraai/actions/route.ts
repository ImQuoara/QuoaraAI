import { isOwnerIdentity } from '@/lib/auth/owner';
import { listActionRequests } from '@/quoaraai/store';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });
  try {
    return Response.json(await listActionRequests(data.user.id));
  } catch (err) {
    console.error('QuoaraAi actions error:', err);
    return Response.json({ error: 'QuoaraAi intelligence schema is not ready yet.' }, { status: 503 });
  }
}
