# QuoaraAi Mobile Alpha 001F — owner-only fast path

Goal: get a useful personal phone app active as quickly as possible with chat, live research, image creation, and owner controls while preventing silent spending or authority expansion.

## Added in 001F
- Owner-only server gate using `QUOARAAI_OWNER_USER_ID`.
- Public app signup removed from the UI.
- Installable PWA manifest + security-minimal service worker with no authenticated caching.
- New mobile Research tab and Tavily search adapter.
- Tavily adapter accepts only `QUOARAAI_RESEARCH_COST_MODE=free_only` and has no paid fallback.
- Chat provider is now off by default and requires explicit `free_only` configuration before any model call.
- Paid Gemini image generation remains off by default and now uses a two-step server-recorded, expiring, single-use approval record before a provider call.
- Same-origin checks added to new and key mutation routes.
- Request-size guards added to key POST routes.
- Stronger browser security headers and no-store API caching.
- Protected chat conversation queries now explicitly bind to owner `user_id`.
- Content/provider boundary document added.

## Deliberately not activated
- No Supabase migration was applied.
- No Vercel project/deployment was created.
- No GitHub write was performed.
- No Tavily account/key was created.
- No paid Gemini image generation was enabled.
- No provider API call was executed while assembling this build.

## Fast activation sequence requiring owner decisions/actions
1. Confirm which existing Supabase auth user ID is Steve and set it as `QUOARAAI_OWNER_USER_ID`.
2. Apply the reviewed Milestone 2 migrations if the owner approves the exact migration set.
3. For no-cost research, Steve may create a Tavily free account/key (currently advertised as 1,000 free credits/month with no card) and explicitly approve enabling the adapter.
4. Confirm the Gemini API project/key is truly on a free/no-billing chat tier before setting `QUOARAAI_CHAT_ENABLED=true`.
5. Deploy the PWA to a free hosting tier only after explicit deployment approval.
6. Install to the Android home screen.
7. Paid image generation remains optional and requires exact per-image approval.

## Important limitation
The alpha is owner-account locked, but not yet cryptographically bound to one physical handset. A later passkey/WebAuthn device-binding layer can enforce possession of Steve's phone in addition to account authentication.
