export function isMutationMetadataSameOrigin(
  requestUrl: string,
  origin: string | null,
  fetchSite: string | null,
) {
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  if (!origin) return fetchSite === 'same-origin' || fetchSite === 'none';

  try {
    const request = new URL(requestUrl);
    const suppliedOrigin = new URL(origin);
    return request.protocol === suppliedOrigin.protocol && request.host === suppliedOrigin.host;
  } catch {
    return false;
  }
}

export function isUnsafeContentLength(raw: string | null, maxBytes: number) {
  if (raw === null) return false;

  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) return true;

  const size = Number(normalized);
  return !Number.isSafeInteger(size) || size > maxBytes;
}
