# QuoaraAi 001N — Canonical Baseline Stabilization

001N is a local source-only stabilization pass over owner-supplied 001M. It does **not** deploy, modify Supabase, write GitHub, spend provider credits, or change external permissions.

## Changes
- Android version bumped to `0.4.1-alpha` / `versionCode 5`.
- Backend package version bumped to `1.1.1`.
- Reconciled stale `package-lock.json` root identity from `project-self-milestone1` to `quoaraai-backend`.
- Hardened configured backend URLs to root HTTPS origins only.
- Hardened auth WebView navigation to the exact configured origin instead of host-only matching.
- Updated Android owner-shell user agent to `QuoaraAi-Android/0.4`.
- Removed stale `self.example.com` setup hint.
- Fixed PWA manifest icon path to the existing `quoaraai-icon.svg`.
- Corrected Android README `minSdk` to 28 to match Gradle.
- Corrected free APK workflow documentation filename.
- Added canonical root `.gitignore` for backend/Android build outputs and secrets.
- Removed bundled dependency directories from the source handoff.
- Added `CANONICAL-PROJECT-STATE.md` as the first source-of-truth handoff document.

## Verification performed
- Source archive SHA-256 recorded before changes.
- Static scan found no embedded provider/API secret values.
- Android AGP/Gradle/JDK/SDK combination was cross-checked against current official Android documentation.
- Google Play target API requirement was cross-checked; targetSdk 36 is correct for new apps/updates after 2026-08-31.

## Verification still required
- Backend dependency install, lint, typecheck, tests, and production build.
- Android debug APK compile.
- Runtime login on the approved deployed backend.
- Canonical Supabase migration/state verification.
- Canonical GitHub repository/commit SHA.
