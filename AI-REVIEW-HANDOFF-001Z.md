# QuoaraAi 001Z release hardening

001Z is a backend-only hardening release. The installed Android client remains 001U / 0.4.8-alpha / versionCode 12 and does not require reinstall for this release.

## Release identity

- Release track: 001Z
- Backend: 1.1.13
- Android source baseline: 001U
- Android application ID: com.imquoara.quoaraai
- Android version: 0.4.8-alpha
- Android versionCode: 12

## Changes

- Fixes `/api/mobile/capabilities` so backend/release identity is no longer stale.
- Reports backend release identity separately from Android client identity while preserving `sourceBaseline` as a backward-compatible backend release alias for the installed shell.
- Fails closed when mutation requests contain neither `Origin` nor trusted `Sec-Fetch-Site` metadata.
- Rejects malformed, negative, non-integer, and oversized `Content-Length` metadata.
- Adds focused regression tests for mutation metadata and request-size guards.
- Runs backend and Android verification workflows on pull requests targeting `main`.
- Corrects stale README language about the server-only Supabase privileged credential.
- Keeps paid provider fallback disabled and makes no provider activation change.

## Independent review targets

Review the final merged source and deployment evidence for:

1. Supabase Auth and exact owner identity enforcement.
2. RLS and fail-closed privileged-table behavior.
3. SECURITY DEFINER ACLs and `search_path` hardening.
4. Server-only Supabase secret/service-role exposure.
5. CSRF/origin and `Sec-Fetch-Site` handling.
6. Android P-256 signing, replay protection, action-hash binding, expiry, and nonce handling.
7. APK secret leakage.
8. Provider cost/fallback rules.
9. Dependency vulnerabilities.
10. GitHub Actions supply-chain security.
11. Current Cloudflare, Tavily, Gemini, Android/API-level, and deployment requirements.

Perplexity or another reviewer should return findings only and must not modify source.
