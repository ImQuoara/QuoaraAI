# QuoaraAi Android / APK Plan 001J

## Decision
Move QuoaraAi from "PWA as the product" to "Android app as the primary owner client" while retaining a secure server backend.

This is not merely cosmetic. It unlocks later native capabilities without ever placing AI/provider secrets in the APK.

## Phase 1: secure Android shell
- owner-only authentication through QuoaraAi backend
- Chat / Research / Create / Control UI delivered through the existing mobile-first interface
- HTTPS origin allowlist
- no native JS bridge
- no cleartext network traffic
- no embedded secrets

## Phase 2: Android-native owner security
- biometric/passkey unlock
- Android Keystore-bound device identity
- session reauthentication for privileged actions
- screenshot/privacy controls where useful
- notification permission only when an owner-facing watcher requires it

## Phase 3: native media workflow
- Android Photo Picker
- camera capture
- image upload/edit workflow
- share generated image using Android Sharesheet
- local encrypted drafts and generated-media cache

## Phase 4: research and assistant polish
- source viewer / open-in-browser
- voice input
- text-to-speech responses
- background-safe download/export
- owner-controlled notification summaries

## Phase 5: video creation
- provider-agnostic VideoProvider interface
- storyboard -> shot prompts -> generation -> result vault
- free/zero-cost route preferred; any paid provider requires exact cost approval
- generation jobs persisted server-side so Android can reconnect without duplicate generation

## Phase 6: sellable product
- multi-tenant server boundary
- Play-ready release signing
- privacy/data export/delete controls
- billing/quotas for customer plans, while Owner Root remains subscription $0
- OAuth integration framework for YouTube/Meta/etc.
- integrations start read-only; publish/post/upload actions require exact user approval
