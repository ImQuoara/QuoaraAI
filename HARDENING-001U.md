# QuoaraAi 001U — CI Repair

Evidence source: first GitHub Actions runs from canonical 001T commit.

Changes:
- ProjectsClient initial fetch no longer synchronously calls state-setting loader from an effect.
- ResearchClient uses a typographic apostrophe to satisfy JSX lint.
- Login uses Next.js router navigation instead of `window.location.assign` for an internal route.
- Android setup action is limited to `platform-tools`; API 36/build-tools installation remains an explicit `sdkmanager` step.
- Android bumped to `0.4.8-alpha` / code `12`; backend bumped to `1.1.8`; baseline `001U`.

No claim of CI/build success is made until GitHub Actions proves it.
