# QuoaraAi 001S — Pre-CI Hardening

## Changes
- Android: `0.4.6-alpha`, `versionCode 10`, source baseline `001S`.
- Backend: `1.1.6`.
- `ApiClient` now uses `BackendConfig.origin()` instead of independently rebuilding the HTTP `Origin` header.
- Added `tools/verify_source.py`, a dependency-free source identity/security preflight.
- Backend and Android GitHub Actions workflows run that preflight immediately after checkout.
- Phone installation proof gate updated for 001S.

## Why
The old `ApiClient` origin formatter did not bracket IPv6 hosts, while `BackendConfig.origin()` did. A valid IPv6 backend could therefore produce an invalid/mismatched Origin header even though it passed backend configuration. One canonical parser now controls both.

## Verification boundary
Static/preflight checks can validate source consistency. They do not prove npm dependency installation, Next.js build/runtime behavior, Android compilation, live Supabase state, GitHub Actions execution, APK signing, or physical-phone behavior.
