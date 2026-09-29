# QuoaraAi Mobile Alpha 001H — Free-First Provider Router

Goal: get owner-only chat, sourced research, and image creation as far as possible before Steve pays anything.

## Zero-dollar stack

- Chat: Cloudflare Workers AI Free allocation. Primary free pool defaults to Meta Llama 4 Scout, Gemma 4 26B, and GPT-OSS 20B.
- Images: Cloudflare Workers AI Free allocation. `Auto Free` routes between FLUX.1 Schnell and Leonardo Phoenix. No paid fallback exists.
- Research: Tavily Researcher Free plan, currently 1,000 API credits/month, no card required, stop-on-exhaustion.
- Database/auth: existing Supabase project. No new project or paid branch is required by this build.

## Guardrails

1. Cloudflare routes refuse to run unless `QUOARAAI_CLOUDFLARE_FREE_ONLY=true` and the owner explicitly sets `QUOARAAI_CLOUDFLARE_FREE_PLAN_CONFIRMED=true` after confirming the account is on Workers Free.
2. Chat failover stays inside the configured `@cf/` Workers AI model pool. It never jumps to a third-party paid AI Gateway route.
3. Image approval hashes include the provider, routing policy, full free model candidate list, prompt, aspect ratio, and $0 maximum provider-cost ceiling.
4. Image fallback can only move within that pre-approved free model list.
5. Free-quota exhaustion returns an error. No paid retry or provider upgrade is attempted.
6. Direct Meta Muse Image and direct Leonardo Production API are intentionally not used because their current API offerings are paid.
7. Gemini remains available in the codebase but is not automatic fallback because the application cannot prove from an API key alone that the associated Google project is unbilled.

## Setup still required before live use

No external setup was performed by creating this build. To activate it later:

- Create/confirm a Cloudflare Workers Free account.
- Create a Workers AI token and copy Account ID.
- Keep the account on Workers Free and do not enable prepaid/Workers Paid billing.
- Create a Tavily Researcher Free key if research is desired.
- Apply the already-prepared owner-control migration to the canonical QuoaraAi Supabase project (requires separate owner approval because it mutates the database).
- Set server environment variables and deploy (each persistent external step requires owner approval).

## Content boundary

QuoaraAi does not add a blanket adult-content prohibition of its own. The absolute project restrictions on minors/children, exploitation/coercion, non-consensual intimate imagery, and unlawful content remain. Provider terms and provider-side safety controls also still apply and are not bypassed.
