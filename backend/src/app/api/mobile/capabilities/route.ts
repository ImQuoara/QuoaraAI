import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';
import { providerRegistry } from '@/providers/registry';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) {
    return Response.json({ error: 'Owner access required.' }, { status: 403 });
  }

  return Response.json({
    app: 'QuoaraAi',
    sourceBaseline: '001R',
    backendVersion: '1.1.4',
    clientMode: 'android_owner_alpha',
    providers: providerRegistry(),
    guarantees: {
      noSilentSpending: true,
      noAutonomousPolicyChanges: true,
      noAutonomousPermissionChanges: true,
      noPaidAutomaticFallback: true,
      ownerApprovalForExternalActions: true,
      deviceSignedApprovalsRequired: process.env.QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED === 'true',
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
