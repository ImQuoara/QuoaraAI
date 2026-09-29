# QuoaraAi 001T — Phone Installation Proof Gate

Installation is not complete merely because an APK exists. The phone-install milestone must be proven.

## Before installation
- Source baseline: `001T`.
- Package: `com.imquoara.quoaraai`.
- Version: `0.4.7-alpha` / `versionCode 11`.
- Record APK SHA-256.
- Confirm package/version with `aapt dump badging`.
- Confirm signature with `apksigner verify --verbose --print-certs`.
- Tie the APK to the exact canonical GitHub commit/build being tested.

The Android build workflow emits `APK-PROOF.txt` beside the APK.

## On-phone proof
Open QuoaraAi, pass the owner gate, then open **Control**. It must visibly report:
- package `com.imquoara.quoaraai`
- version `0.4.7-alpha (11)`
- source baseline `001T`
- configured HTTPS backend origin
- backend version/baseline from `/api/mobile/capabilities`

Then verify owner authentication, backend login/session, device-key status, biometric/device-credential registration, rejection behavior, one-time signed $0 action execution, and reopen/session behavior.

## Evidence required before calling installation VERIFIED
- APK + SHA-256
- `APK-PROOF.txt`
- phone installation success evidence
- screenshot/photo of the Control build identity
- launch/auth test result
- exact error text for any failure

ChatGPT cannot physically inspect the phone UI by itself. At the installation step, the owner must provide the resulting screen/log/screenshot so the installed artifact can be cross-checked against build evidence.
