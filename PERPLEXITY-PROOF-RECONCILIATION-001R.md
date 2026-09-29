# Perplexity proof reconciliation — 001R

Perplexity reviewed the text proof pack for 001Q and reported that the Android CI proof command was malformed and that several source files were missing. Direct inspection of the actual 001Q ZIP showed that those conclusions were artifacts of the text-pack representation, not defects in the source archive.

## Directly confirmed from 001Q ZIP

- `.github/workflows/build-quoaraai-android.yml` contains valid quoted Bash assignments for `APK` and `PROOF`.
- The proof report is written using `} | tee "$PROOF"`.
- `android/app/proguard-rules.pro` exists.
- `SOURCE-MANIFEST-001Q.sha256` exists.

## 001R hardening

- Added `test -f "$APK"` before generating the proof report.
- Added `test -s "$PROOF"` after generating it.
- Advanced Android to `0.4.5-alpha` / versionCode `9`.
- Advanced backend package to `1.1.5`.
- Rebuilt the external proof pack to include every UTF-8 decodable source/config/document file, regardless of extension, including `.pro`, `.sha256`, `.diff`, and `.svg`.

## Still not proven

The workflow has not run in GitHub Actions yet, no APK is claimed built, and physical-device installation remains unverified.
