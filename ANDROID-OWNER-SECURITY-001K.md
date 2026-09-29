# QuoaraAi Android Alpha 001K — Owner Device Security + Provider Contracts

## What changed
- Native launch gate now requires Android biometric/device-owner verification on supported devices.
- The APK no longer requires a backend URL at compile time. The owner may enter a trusted HTTPS QuoaraAi backend on first launch.
- The saved backend is constrained to HTTPS and all in-app navigation remains locked to that exact host.
- Provider secrets remain server-side only.
- The backend now has explicit provider contracts for chat, research, image, video, and voice-ready expansion.
- A read-only owner-authenticated mobile capabilities endpoint reports which providers are actually active.
- Video now has a formal provider interface but no enabled provider, so adding video later will not require rewriting the Android client.

## Security notes
The current biometric gate protects app launch but is not yet cryptographically bound to server-side action approvals. The next hardening stage should use an Android Keystore key plus server-issued challenge signatures for high-risk approvals.

The runtime backend URL is intentionally owner-entered so an APK can be built before final hosting is selected. Future production releases should optionally pin the production host/certificate/public key after the deployment is stable.

## Still not done
- No Android binary was compiled in this container because Android SDK/build tools are not installed here.
- No new Supabase migration was applied.
- No hosting/deployment was performed.
- No paid provider was enabled.
