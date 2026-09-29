# QuoaraAi 002A Final Build Candidate

Identity:
- Release track: 002A
- Backend: 1.2.0
- Android: 1.0.0 (13)
- Android source baseline: 002A
- Package: com.imquoara.quoaraai
- Production backend: https://quoaraai-backend.vercel.app

## Final-build guarantees

- Owner-only Supabase authentication remains enforced.
- The Android build pins the reviewed production backend origin.
- Cleartext traffic and Android backup remain disabled.
- Chat, Research, and Image integrations fail closed unless their exact free-only configuration is complete.
- No provider may automatically fall back to a paid route.
- Cloudflare activation requires explicit owner confirmation that the account is on Workers Free.
- Image generation requires a registered Android owner device and an exact P-256 signed, zero-dollar action approval.
- Password recovery returns through the QuoaraAi production auth callback instead of localhost.

## Provider connection gate

Chat:
- Cloudflare Workers AI account ID + API token
- QUOARAAI_CLOUDFLARE_FREE_ONLY=true
- QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED=true
- QUOARAAI_CHAT_ENABLED=true
- QUOARAAI_CHAT_COST_MODE=free_only
- QUOARAAI_CHAT_PROVIDER=cloudflare_free

Research:
- Tavily API key
- QUOARAAI_RESEARCH_ENABLED=true
- QUOARAAI_RESEARCH_COST_MODE=free_only

Image:
- Same confirmed Workers Free credentials as Chat
- QUOARAAI_IMAGE_GENERATION_ENABLED=true
- QUOARAAI_IMAGE_COST_MODE=free_only
- QUOARAAI_IMAGE_PROVIDER=cloudflare_free
- QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED=true

## External configuration still required before final phone verification

1. Vercel must hold the valid Supabase server secret.
2. Supabase Auth must allow:
   https://quoaraai-backend.vercel.app/auth/callback
3. Cloudflare Workers Free status must be owner-confirmed before provider activation.
4. Tavily must be on the free Researcher allowance before activation.
5. Run provider smoke tests before installing the final APK.
6. Register the final Android device, then verify Chat, Research, Image, and persistence end-to-end.

Do not call this release fully verified until GitHub backend CI, Android APK CI, live provider tests, and final phone tests have all passed.
