# QuoaraAi 001Q AI review handoff

Baseline: 001Q
Android: `com.imquoara.quoaraai`, `0.4.4-alpha`, versionCode 8
Backend: 1.1.4

Purpose: installation provenance and proof.

Review targets:
- BuildConfig version/baseline display logic
- `/api/mobile/capabilities` build identity fields
- APK proof workflow commands/path assumptions
- no stale hard-coded Android UA version
- any condition that could make installed package/version differ from the build evidence

Do not claim npm/Gradle/build/runtime success until CI or physical-device evidence exists.
