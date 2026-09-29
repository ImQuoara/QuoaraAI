# QuoaraAi 001R — proof reconciliation and install-evidence hardening

001R reconciles the Perplexity 001Q proof review against the actual source archive.

## Findings accepted

- Independent review cannot prove a ZIP digest if the reviewing service does not accept the ZIP bytes.
- Build/runtime/Supabase/phone behavior remains unverified until those environments are actually exercised.
- The APK proof step benefits from explicit file-existence and non-empty-output assertions.

## Findings corrected by direct archive inspection

The actual 001Q archive contains valid Bash in `.github/workflows/build-quoaraai-android.yml`:

- `APK="android/app/build/outputs/apk/debug/app-debug.apk"`
- `PROOF="android/app/build/outputs/apk/debug/APK-PROOF.txt"`
- `} | tee "$PROOF"`

It also contains:

- `android/app/proguard-rules.pro`
- `SOURCE-MANIFEST-001Q.sha256`

Those files were omitted by the first external text proof-pack generator because it filtered by file extension. 001R replaces that proof pack with a UTF-8-content based pack instead of an extension whitelist.

## 001R changes

- Android: `0.4.5-alpha`, versionCode `9`.
- Backend: `1.1.5`.
- Baseline identifiers advanced to `001R`.
- APK CI adds `test -f "$APK"` before proof generation.
- APK CI adds `test -s "$PROOF"` after proof generation.
- External proof pack includes every UTF-8 decodable source/config/document file regardless of extension.

## Static verification performed

- backend package/package-lock identity consistency: PASS
- Android SDK/version/baseline consistency: PASS
- Android XML parsing: PASS
- backend mobile capabilities baseline: PASS
- APK proof Bash fragment syntax (`bash -n`): PASS
- proof-critical file presence: PASS
- common live API/token shape scan: PASS

## Not yet verified

- GitHub Actions execution
- npm dependency install/lint/typecheck/tests/production build
- Android APK compilation/signature output
- canonical Supabase migration/runtime state
- authentication against deployed backend
- physical phone installation and security behavior
