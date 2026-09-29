# QuoaraAi 001N — External AI Review Handoff

Review the exact 001N source package. Do not rewrite it. Return findings only.

Focus on:
1. Android build correctness and Android 16/API 36 behavior.
2. Android security: WebView/auth cookies, exact-origin restriction, Android Keystore signing, biometric/device-credential flow, network security, exported components.
3. Next.js/Supabase auth/session correctness and owner-only fail-closed behavior.
4. RLS/service-role/server-boundary issues and migration correctness.
5. Provider routing, zero-dollar enforcement, idempotency/concurrency, approval integrity, and audit ledger correctness.
6. Compile/type/runtime defects, stale names/versions, missing files, and deployment blockers.

For every finding label: PROVEN, LIKELY, or NEEDS RUNTIME VERIFICATION. Include file path + line/function, impact, and smallest safe fix. Do not claim implementation without evidence.

Maximum response: 12,000 characters.
