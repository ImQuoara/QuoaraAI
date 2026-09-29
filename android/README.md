# QuoaraAi Android Alpha Shell

This Android project packages the owner-only QuoaraAi experience as an installable APK while keeping all privileged secrets and AI provider credentials on the server.

## Why a native shell instead of embedding provider credentials
The phone APK is untrusted distribution material: a determined user can inspect it. Cloudflare, Tavily, Supabase secret/service keys, and later social-provider secrets must therefore remain server-side.

The Android app contains only a configured HTTPS QuoaraAi application URL. Authentication and AI operations continue through the protected QuoaraAi backend.

## Current Android baseline
- applicationId: `com.imquoara.quoaraai`
- minSdk: 28
- targetSdk: 36
- compileSdk: 36
- Android Gradle Plugin: 9.4.0
- Gradle expected: 9.6+

## Security posture
- HTTPS only; cleartext disabled at manifest/network level.
- Navigation is restricted to the compiled QuoaraAi origin.
- External links open outside the QuoaraAi WebView.
- File/content access disabled.
- Mixed content disabled.
- Third-party cookies disabled.
- Safe Browsing returns to safety.
- No JavaScript-to-native bridge.
- Backups disabled.
- No provider/API secrets in APK.

## Build
Set the approved deployed QuoaraAi origin at build time:

```bash
gradle :app:assembleDebug -PQUOARAAI_APP_URL=https://your-quoaraai-host.example
```

Debug output will be:
`app/build/outputs/apk/debug/app-debug.apk`

A release build must use an owner-controlled signing key and should never store that key in source control.

## Important
Until QuoaraAi has an approved HTTPS backend deployment, a compiled APK cannot provide chat/research/image functionality securely. The APK is the client; secrets and paid/free provider routing stay behind the server boundary.
