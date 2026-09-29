# QuoaraAi 001O — Approval Integrity Hardening

001O is a local source-only hardening pass over 001N. It does not write GitHub, deploy, modify Supabase, spend provider credits, or change external permissions.

## Verified issues corrected

1. **Signed action binding at execution time**
   - 001N verified the device signature when an action was approved, but image execution trusted the stored payload afterward.
   - 001O deterministically recomputes the approved image action hash from owner ID, prompt, aspect ratio, mode, exact free-model candidates, routing policy, and zero-dollar ceiling.
   - Execution re-verifies the stored Android P-256 approval signature against the exact action hash before any provider call.
   - A revoked approving device now blocks execution.

2. **Stable expiry binding**
   - Approval challenges previously depended on the database timestamp string representation.
   - 001O stores the exact challenge expiry string inside the action payload, compares it to the database expiry by instant, and uses the exact signed representation for verification.

3. **Atomic signed approval + audit record**
   - 001N updated an action to approved and then wrote the audit ledger separately.
   - 001O adds `approve_owner_action_request(...)`, a server-only SQL function that updates the pending zero-dollar action and appends the approval ledger entry atomically.

4. **Atomic control-console decision + audit record**
   - `decideActionRequest` previously changed status before writing the ledger.
   - 001O adds `decide_owner_action_request(...)` and routes decisions through the atomic function.

5. **Atomic owner-device registration + audit record**
   - Device registration previously upserted the device before attempting the ledger write.
   - 001O adds `register_owner_device(...)` so registry mutation and audit append happen together.
   - A revoked device key cannot silently reactivate itself through the registration endpoint.

6. **Append-only application audit ledgers**
   - Earlier migrations granted service-role update/delete rights to the ledger tables.
   - 001O revokes update/delete/truncate from `owner_action_ledger` and `quoaraai_action_ledger`, leaving application access at select/insert.

7. **Android external navigation hardening**
   - The auth WebView no longer attempts to launch arbitrary non-HTTP(S) URI schemes externally.
   - Only normal HTTP/HTTPS off-origin links are delegated to the system browser.

8. **Version/workflow cleanup**
   - Android: `0.4.2-alpha`, versionCode `6`.
   - Backend: `1.1.2`.
   - Android workflow artifact name is now version-neutral.
   - Added a manual backend verification workflow for locked install, lint, typecheck, tests, and production build.

## Verification performed locally

- 001M SHA-256: `f0f86a88f99e2a85fb43b706e6ff67893fe0600a9113187daaaa14b21db946b8`
- 001N SHA-256: `2615a5eb59accc19092615e1e6336823acb41abc3f264581a2942cc2e950e866`
- Package/package-lock identity and version consistency: PASS.
- Android manifest and network-security XML parsing: PASS.
- Static secret-pattern scan: PASS; no live provider/API secret values found.
- New image-action canonicalization/tamper checks executed under Node 22 type stripping: PASS.
- P-256 approval challenge/signature runtime check: PASS.

## Still not verified here

- `npm ci`, ESLint, full TypeScript typecheck, full test suite, and `next build`: blocked because this sandbox cannot reach npm registry and the original archive did not contain usable dependency files.
- Android Gradle compile/APK build: Android SDK/Gradle are not installed in this sandbox.
- SQL migration execution against canonical Supabase: not performed.
- Runtime login against a deployed QuoaraAi backend: not performed.
- GitHub repository/commit/CI runs: not created or executed.

These remain explicit evidence gates, not assumed successes.
