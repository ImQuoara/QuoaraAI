# QuoaraAi Mobile Alpha 001E

This local build starts the fastest credible phone-first QuoaraAi path without touching production infrastructure.

## Added now
- Mobile bottom navigation across Chat/Create/Projects/Control.
- Create screen for image generation.
- Paid image generation route using Gemini 3.1 Flash Lite Image, disabled by default.
- Per-generation exact cost approval gate and 10-minute approval expiry.
- Fail-closed requirement that the QuoaraAi approval/audit schema is available before any paid provider call.
- Action request, action ledger, and cost event recording around image generation.
- Projects mobile UI using the existing server-only project API.
- Tenant/project ownership hardening migration for privileged QuoaraAi writes.
- Governance Charter v1.0 and Perplexity parallel-work brief.

## Deliberately not activated
- No Supabase migration was applied.
- No image generation provider call was executed.
- `QUOARAAI_IMAGE_GENERATION_ENABLED` remains false by default.
- No Vercel/GitHub deployment or write occurred.
- No web-search provider was activated.
- No video provider was activated.

## Next proposed slice
- Run/install dependencies and full tests/build locally.
- Fix any compile/test issues.
- Add Research mode/provider adapter with the same owner/cost guard.
- Add candidate-memory review UI; no automatic long-term learning.
- Add exact Intent Lock persistence schema before broader external tools.
