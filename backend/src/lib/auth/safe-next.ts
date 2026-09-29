const FALLBACK_PATH = '/chat';
const BASE_ORIGIN = 'https://quoaraai.invalid';

export function normalizeSafeNext(value: string | null): string {
  if (!value) return FALLBACK_PATH;

  let candidate = value;
  try {
    for (let pass = 0; pass < 2; pass += 1) {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) break;
      candidate = decoded;
    }
  } catch {
    return FALLBACK_PATH;
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) return FALLBACK_PATH;
  if (candidate.includes('\\') || candidate.includes('@') || candidate.includes('://')) {
    return FALLBACK_PATH;
  }
  if (/\p{Cc}/u.test(candidate)) return FALLBACK_PATH;

  try {
    const parsed = new URL(candidate, BASE_ORIGIN);
    if (parsed.origin !== BASE_ORIGIN) return FALLBACK_PATH;

    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!normalized.startsWith('/') || normalized.startsWith('//')) return FALLBACK_PATH;
    return normalized;
  } catch {
    return FALLBACK_PATH;
  }
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname === '/auth/callback' || pathname.startsWith('/auth/callback/');
}
