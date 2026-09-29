# QuoaraAi 001Q — Install Provenance & Proof Gate

001Q is a local source-only progression from 001P. No GitHub, Supabase, deployment, billing, provider, or permission state was changed.

Changes:
- Android `0.4.4-alpha` / versionCode `8`.
- Backend package `1.1.4`.
- Android auth user-agent now derives from `BuildConfig.VERSION_NAME` instead of a stale hard-coded value.
- Added `BuildConfig.QUOARAAI_SOURCE_BASELINE = 001Q`.
- Control screen displays installed package/version/source baseline/backend origin.
- `/api/mobile/capabilities` reports backend version and source baseline.
- Android build workflow creates `APK-PROOF.txt` with SHA-256, package/version badging, and signature verification.
- Added `INSTALL-PROOF-GATE-001Q.md`.
