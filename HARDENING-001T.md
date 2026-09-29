# QuoaraAi 001T — CI Bootstrap Hardening

Current identity:
- Baseline: `001T`
- Android: `0.4.7-alpha`, `versionCode 11`
- Backend: `1.1.7`

Changes from 001S:
- Fixed backend verification workflow working-directory handling so `tools/verify_source.py` runs from repository root.
- Added automatic `push` trigger on `main` to Android and backend verification workflows.
- Retained manual `workflow_dispatch` for reruns.
- Bumped source/application identity so CI evidence can be tied to this exact baseline.

Verification status:
- Dependency-free source preflight: expected to pass locally and in CI.
- YAML/XML/JSON/static identity checks: local gate required before packaging.
- npm install/lint/typecheck/test/build: not yet runtime-verified.
- Android APK build/signature proof: not yet runtime-verified.
- Live Supabase and phone behavior: not yet runtime-verified.
