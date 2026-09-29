# QuoaraAi Mobile Alpha 001G — minimal active core

This is the reduced critical-path build for Steve's phone-first personal QuoaraAi.

## Active product target
- Owner-only chat
- Live web research with source snippets
- Image generation with explicit cost approval
- Owner control/status screen
- Installable Android-friendly PWA

Projects and the broader Milestone 2 intelligence system remain in source for later work but are no longer part of the first activation path.

## Database dependency reduced
001G adds one small migration:

`supabase/migrations/20260928002000_owner_alpha_controls.sql`

It creates only:
- `owner_action_requests`
- `owner_action_ledger`
- `owner_cost_events`

Browser roles receive no privileges on these tables. The service role is used only after the server has authenticated and matched `QUOARAAI_OWNER_USER_ID`.

The larger `20260928000000_quoaraai_intelligence_foundation.sql` and `20260928001000_quoaraai_project_tenant_guard.sql` are **not required** to activate the first phone alpha.

## Cost rules
- Chat is off until the owner confirms the Gemini project/key is on a no-charge tier and explicitly enables it.
- Research is off until a Tavily free/no-card key is configured and free-only mode is explicitly enabled.
- Image generation is paid and stays off until explicitly enabled; every generation requires its own recorded, expiring, single-use approval.
- No paid fallback exists in the fast-path research or chat configuration.

## Remaining activation actions
All are external/persistent and therefore require Steve's exact approval before execution:
1. Apply only `20260928002000_owner_alpha_controls.sql` to canonical Supabase.
2. Set `QUOARAAI_OWNER_USER_ID` and the approved provider environment flags/keys.
3. Create/deploy a hosting project on an approved no-cost tier.
4. Install the resulting PWA on Steve's phone.

## Security limitation to resolve after first usable alpha
Owner authentication is account-bound, not yet cryptographically bound to one physical handset. Passkey/WebAuthn device binding is the next hardening step once the app is live.
