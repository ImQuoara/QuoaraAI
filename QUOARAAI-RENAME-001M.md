# QuoaraAi 001M — Product Rename

The product formerly developed under the working name **SELF** is now branded **QuoaraAi**.

## Renamed in this source package
- Android app label: `QuoaraAi`
- Android application ID / namespace: `com.imquoara.quoaraai`
- Android Java package: `com.imquoara.quoaraai`
- backend package: `quoaraai-backend`
- app metadata, manifest, PWA metadata, UI copy, docs, tests, workflow names
- environment-variable prefix: `QUOARAAI_`
- device approval challenge prefix and Android Keystore alias
- internal API namespace: `/api/quoaraai/...`
- future/unapplied intelligence tables: `quoaraai_*`
- internal TypeScript module: `src/quoaraai`

## Intentionally not renamed in the live database
The already-live owner control tables (`owner_action_requests`, `owner_action_ledger`, `owner_cost_events`, `owner_devices`) are generic and do not expose the old brand, so renaming them would add migration risk with no product benefit.

The Supabase project display name may still appear as the historical `Self build` name until the project-management surface supports a safe rename. This does not affect the app brand or API behavior.
