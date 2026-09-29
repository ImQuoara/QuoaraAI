import 'server-only';

import { isMutationMetadataSameOrigin, isUnsafeContentLength } from './request-core';

export function isSameOriginMutation(request: Request) {
  return isMutationMetadataSameOrigin(
    request.url,
    request.headers.get('origin'),
    request.headers.get('sec-fetch-site'),
  );
}

export function bodyTooLarge(request: Request, maxBytes: number) {
  return isUnsafeContentLength(request.headers.get('content-length'), maxBytes);
}
