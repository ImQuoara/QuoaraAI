import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';
import { providerRegistry } from '@/providers/registry';

const RELEASE_TRACK = '002A';
const BACKEND_VERSION = '1.2.0';
const ANDROID_IDENTITY = {
  sourceBaseline: '002A',
  applicationId: 'com.imquoara.quoaraai',
  version: '1.0.0',
  versionCode: 13,
} as const;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) {
    return Response.json({ error: 'Owner access required.' }, { status: 403 });
  }

  return Response.json({
    app: 'QuoaraAi',
    releaseTrack: RELEASE_TRACK,
    sourceBaseline: RELEASE_TRACK,
    backendVersion: BACKEND_VERSION,
    android: ANDROID_IDENTITY,
    clientMode: 'android_owner_final',
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
