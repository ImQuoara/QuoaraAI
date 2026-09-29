# Free APK build path

The Android project is pinned to AGP 9.4.0. Google's current compatibility table requires Gradle 9.6.0, Build Tools 36.0.0, and JDK 17.

A manual GitHub Actions workflow is included at:
`.github/workflows/build-quoaraai-android.yml`

It does not run automatically. The owner must explicitly start `workflow_dispatch` after the repository is connected.

The workflow:
1. checks out the source,
2. installs JDK 17,
3. installs Android API 36 / Build Tools 36.0.0,
4. uses Gradle 9.6.0,
5. builds a debug APK,
6. uploads the APK as a short-lived GitHub Actions artifact.

No deployment or provider calls occur as part of the Android compilation.
