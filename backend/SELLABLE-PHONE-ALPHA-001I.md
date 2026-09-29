# QuoaraAi Mobile Alpha 001I — Sellable Free-First Phone Alpha

## Product target
A private, owner-controlled AI workspace for Steve's phone with:
- chat
- sourced research
- image creation
- owner-only controls
- no silent spending
- no autonomous external actions

## Positioning
Do **not** market QuoaraAi as fully autonomous or self-governing.

Use positioning like:
> A private, owner-controlled AI workspace that remembers your projects, researches with sources, creates images, and never takes external action without your permission.

## Content boundary
QuoaraAi does not add a blanket adult-content prohibition of its own.
It does block:
- sexual content involving minors or age-evasion
- non-consensual/coercive sexual content
- exploitative or abusive sexual content

Provider-side content restrictions still apply.

## Fastest free-first stack
- Chat: Cloudflare Workers AI free pool
- Research: Tavily free plan
- Images: Cloudflare Workers AI free pool (Flux/Leonardo)
- Hosting: free-tier deployment target later
- Database/auth: existing Supabase project

## Next activation blockers
1. Apply `20260928002000_owner_alpha_controls.sql` to the canonical Supabase project.
2. Set owner and provider environment variables.
3. Deploy the PWA to an approved no-cost host.
4. Install to Steve's phone.

## Later after first live alpha
- passkey/device binding
- optional video generation
- project memory/review UI
- sellable onboarding and billing/usage screens

## 001J direction: Android-first client
The primary owner client is now intended to ship as an Android APK. The server-side Next.js/Supabase architecture remains the trusted backend because privileged provider and service credentials must not be embedded in an installable APK.
