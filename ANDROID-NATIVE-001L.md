# QuoaraAi Android 001L — Native Core + Device-Signed Approvals

## What changed
- Chat, Research, Create and Control are now native Android views rather than full-time WebView pages.
- WebView remains only as a temporary authentication bootstrap. After the Supabase web session exists, native HTTP calls use the same secure cookie jar.
- A P-256 owner key is generated inside Android Keystore. The private key is non-exportable.
- External $0 actions can be signed only after biometric/device-credential approval.
- Backend verification uses the registered public key and an exact action challenge.
- A new owner-device registry and device-signed approval migration is prepared, but is NOT applied automatically.
- Image action challenges bind action ID, action hash, expiry, and nonce to prevent replay/substitution.
- The generic web approval route can be disabled for approvals with `QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED=true`.

## Trust boundary
APK contains no AI provider secrets, Supabase service-role secret, Tavily secret, social client secret, or paid-provider credential.

## Activation order
1. Apply `20260928003000_owner_device_security.sql` after owner approval.
2. Deploy backend version containing the mobile device endpoints.
3. Set `QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED=true`.
4. Build/install APK.
5. Sign in through the one-time auth WebView.
6. Open Control and explicitly register the phone.
7. Generate an image and confirm biometric signed approval end-to-end.

## Next native conversion
Replace WebView auth bootstrap with native Supabase PKCE/Credential Manager login after the first signed-approval loop is stable.
