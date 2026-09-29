# QuoaraAi 001P — Gemini review reconciliation

Date: 2026-09-28
Baseline reviewed: 001O
Resulting baseline: 001P

## Accepted / implemented

1. **External WebView navigation hardening**
   - 001O already blocked custom schemes because only `http`/`https` were delegated to `ACTION_VIEW` and every other scheme returned `true` without launching.
   - 001P tightens this further: only **off-origin HTTPS** may open in the system browser. Plain HTTP and custom schemes are blocked.

2. **Dependency security gate in CI**
   - Added `npm audit --omit=dev --audit-level=high` after `npm ci` in `.github/workflows/verify-quoaraai.yml`.
   - This is a build-time gate, not proof that the current source is vulnerability-free until CI runs successfully.

## Rejected / corrected findings

### "Next.js 16.3.6 is vulnerable to GHSA-vcvr-r3jv-pc5j"
Rejected. The official Next.js advisory lists affected versions as `>=16.2.0 <16.3.6` and **16.3.6 as the patched version** for that Sep. 22, 2026 critical `next/og` ImageResponse issue.

A separate scheduled Next.js security release, 16.3.7, is announced for Sep. 30, 2026. As of Sep. 28 it is not yet the current released patch. QuoaraAi should evaluate and upgrade to 16.3.7 promptly once released and compatible; it must not pin a nonexistent/unreleased version.

### "Custom URI schemes can trigger arbitrary intents from the auth WebView"
Rejected for 001O. The inspected code delegated only `http` and `https` to `ACTION_VIEW`; `intent:`, `tel:`, `mailto:` and other schemes returned `true` and were not launched. 001P nevertheless tightens external delegation to HTTPS only.

### "Approval RPC needs explicit BEGIN/COMMIT and SERIALIZABLE/FOR UPDATE"
Rejected as a required source fix. PostgreSQL SQL functions run inside the caller transaction and SQL functions cannot issue transaction-control commands such as `COMMIT`. The approval RPC performs a conditional `UPDATE ... WHERE status='pending'`, and PostgreSQL serializes competing row writers through row locking. A second concurrent approval cannot update the same row after the first changes its status.

Runtime concurrency tests against the canonical Supabase project remain required before production deployment.

### "Audit trigger must stop UPDATE/DELETE even for superusers"
Not adopted as stated. 001O already revokes `UPDATE`, `DELETE`, and `TRUNCATE` from the application `service_role` and grants only `SELECT`/`INSERT` on the ledgers. A database superuser/owner is a fundamentally higher trust boundary and cannot be made meaningfully tamper-proof merely by adding a normal trigger, since sufficiently privileged database roles can alter/disable database objects.

For stronger forensic guarantees later, use an external append-only/tamper-evident audit sink or cryptographic ledger chaining in addition to database permissions.

## Still requires runtime verification

- Canonical Supabase migration application and concurrency behavior.
- `npm ci`, production dependency audit, lint, typecheck, tests, and `next build`.
- Android Gradle build and APK installation.
- Physical-device P-256 / biometric flow.
- End-to-end login and action approval against a deployed HTTPS backend.
