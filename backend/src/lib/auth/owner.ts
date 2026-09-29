import 'server-only';

export interface OwnerIdentity {
  id: string;
  email?: string | null;
}

export function ownerUserId() {
  return process.env.QUOARAAI_OWNER_USER_ID?.trim() || null;
}

export function isOwnerIdentity(user: OwnerIdentity | null | undefined) {
  const configuredOwner = ownerUserId();
  if (!configuredOwner || !user?.id) return false;
  return user.id === configuredOwner;
}

export function ownerConfigurationReady() {
  return Boolean(ownerUserId());
}
