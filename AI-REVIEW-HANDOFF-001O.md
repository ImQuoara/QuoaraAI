# QuoaraAi 001O — External AI Review Handoff

Maximum response: 12,000 characters.

Review the exact 001O source package. Do not rewrite or mutate external systems. Return evidence-backed findings only.

## Canonical identity
- Project: QuoaraAi
- Source version: 001O
- Android: `com.imquoara.quoaraai`, `0.4.2-alpha`, versionCode 6, compile/target SDK 36, min SDK 28
- Backend: `quoaraai-backend` 1.1.2
- Canonical Supabase declared by owner: `Self build` / `csoimooaosncrrhaittf` / `ca-central-1`
- Canonical GitHub repository: not yet created/verified

## Focus review
1. Verify the new signed-action binding and execution-time signature recheck.
2. Review `20260928004000_owner_approval_integrity.sql` for PostgreSQL correctness, privilege safety, atomicity, and race conditions.
3. Verify revoked devices cannot self-reactivate through the mobile registration flow.
4. Verify the service-role application can still insert/select audit ledger rows after append-only privilege hardening.
5. Find any path that could execute an image request whose prompt/model/cost differs from the device-signed action.
6. Review auth/session/cookie/WebView behavior and exact-origin enforcement.
7. Find compile/type/runtime defects and stale tests/documentation.
8. Review all service-role use for confused-deputy or tenant-boundary issues.
9. Review zero-dollar provider enforcement and any route that could silently fall back to paid usage.
10. Identify the smallest safe changes needed before GitHub baseline + CI + APK build.

For each finding label: PROVEN, LIKELY, or NEEDS RUNTIME VERIFICATION. Include file path/function, impact, and smallest safe fix.

Finish with:
- CRITICAL
- HIGH
- MEDIUM/LOW
- CONFIRMED IMPROVEMENTS
- CONTRADICTIONS
- RUNTIME-ONLY CHECKS
- TOP 5 NEXT ACTIONS
