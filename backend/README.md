# Project QuoaraAi — Milestone 1

Milestone 1 provides:
- Supabase email/password authentication
- Row-level security
- Persistent conversations/messages
- Gemini Interactions API streaming
- Provider abstraction (`AIProvider`)
- Mobile-first chat UI
- Server-side request validation
- Mocked tests (no real Gemini API calls)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Create a Supabase project and run the SQL migration.
4. Put the Supabase Project URL + Publishable Key in `.env.local`.
5. Create a Gemini API key and put it in `.env.local`.
6. In Supabase Auth URL configuration, add your local and production callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_DOMAIN/auth/callback`
7. Run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   - `npm run dev`

## Security boundary

No service-role key is used. Gemini secrets stay server-side. RLS prevents cross-user conversation access. Builder Mode, tools, file execution, deployment privileges, and autonomous code modification are intentionally excluded from Milestone 1.

## Security Patch 001C

This patch adds a server-only Supabase secret client for message persistence, removes direct browser message writes, removes database-stored `system` roles, uses structured Gemini Interactions input, applies a database-backed per-user chat rate limiter, hardens auth callback destinations, and adds baseline security headers.

Before deployment, apply every SQL migration to the target Supabase project and configure `SUPABASE_SECRET_KEY` only in the trusted server environment. Never expose that secret through a `NEXT_PUBLIC_` variable.

### Remaining Milestone 1 limitations

- A physical client disconnect can leave a persisted user message without a persisted assistant message.
- Assistant persistence occurs when the streamed response finishes; a database failure at final persistence can still diverge from bytes the client already received.
- Duplicate/retried POSTs do not yet use durable idempotency keys.
- Concurrent sends to the same conversation are not serialized with a distributed lock.
- Conversation context is intentionally limited to the most recent 50 messages.
- Mobile conversation history still needs a dedicated drawer/navigation treatment in a later UI pass.
- The stateless Gemini history reconstruction stores final textual model output only. Milestone 1 has no tools; full preservation of future thought/tool steps must be designed before tool-enabled milestones.


## Security Patch 001C2 — auth reliability pass

This follow-up keeps the 001C security model and improves authentication reliability:

- Propagates Supabase SSR cache/refresh headers from `setAll`.
- Uses a full browser navigation after successful password sign-in so fresh auth cookies are visible to the server proxy immediately.
- Adds a 15-second sign-in timeout and visible network/auth failure state instead of allowing the UI to appear unresponsive.
- Uses the same full-navigation behavior for immediate-session sign-up.

No production deployment is performed by this package.

## Milestone 2 intelligence foundation (local package only)

This build adds the foundation for the 20 planned QuoaraAi capabilities: controlled memory, approved skills, council planning, intelligent model routing, persistent projects/goals, work sessions, verification, self-critique, sandbox adapter boundaries, owner-first permissions, action ledger, rollback snapshots, skill package import/export, knowledge-vault assets, multimodal references, voice adapter boundaries, watchers, goal tracking, cost intelligence, and owner override.

### Owner-first rule
QuoaraAi may read, analyze, and draft without creating an external side effect. Writes, sends, deployments, purchases, deletes, permission changes, and other external mutations are designed to require explicit owner approval first.

### Important deployment order
The new database migration is included but has **not** been applied to Supabase and this package has **not** been deployed. Apply `20260928000000_quoaraai_intelligence_foundation.sql` only after owner approval, then configure/deploy the app.


## Mobile Alpha 001E — started 2026-09-28

The next local-only slice begins the phone-first QuoaraAi product:

- mobile navigation for Chat / Create / Projects / Control
- owner-approved image-generation UI
- paid image route disabled by default
- exact per-generation cost approval and short approval expiry
- fail-closed approval/audit persistence before a paid provider call
- project workspace UI
- tenant/project ownership guard migration for privileged server writes
- Governance Charter v1.0 stored in `docs/QuoaraAi-GOVERNANCE-CHARTER-v1.0.md`

No database migration, provider call, deployment, repository write, or paid action was performed while preparing this build. See `MOBILE-ALPHA-001E.md`.

## Mobile Alpha 001F — owner-only fast path

The phone-first alpha now adds an installable PWA shell, an owner-only server gate, live-source research adapter, stricter mutation checks, and a safer two-step image approval flow.

Important defaults:

- `QUOARAAI_OWNER_USER_ID` must match the authenticated Supabase user ID or protected pages/APIs fail closed.
- Chat is disabled unless `QUOARAAI_CHAT_ENABLED=true` and `QUOARAAI_CHAT_COST_MODE=free_only`.
- Research is disabled unless `QUOARAAI_RESEARCH_ENABLED=true`, `QUOARAAI_RESEARCH_COST_MODE=free_only`, and a server-side `TAVILY_API_KEY` is configured.
- Paid Gemini image generation is disabled unless `QUOARAAI_IMAGE_GENERATION_ENABLED=true`; each image still requires a prepared, recorded, single-use owner approval.
- The service worker intentionally caches no authenticated pages, prompts, API responses, or generated media.
- App-level public signup is disabled for the owner alpha.

See `MOBILE-ALPHA-001F.md` and `docs/QuoaraAi-CONTENT-AND-PROVIDER-BOUNDARIES-v1.0.md`.

## Mobile Alpha 001H — free-first routing

001H adds a zero-dollar provider path: Cloudflare Workers AI Free for chat and image generation (including Meta Llama chat plus Leonardo Phoenix/Flux image routing) and Tavily Free for research. Paid fallbacks are disabled. See `FREE-FIRST-001H.md`.
