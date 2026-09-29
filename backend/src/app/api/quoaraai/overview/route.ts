import { isOwnerIdentity } from '@/lib/auth/owner';
import { QUOARAAI_CAPABILITIES } from '@/quoaraai';
import { getQuoaraAiOverview } from '@/quoaraai/store';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });
    const overview = await getQuoaraAiOverview(data.user.id);
    return Response.json({ capabilities: QUOARAAI_CAPABILITIES, ...overview });
  } catch (error) {
    console.error('QuoaraAi overview error:', error);
    return Response.json({ error: 'QuoaraAi intelligence schema is not ready yet.' }, { status: 503 });
  }
}
