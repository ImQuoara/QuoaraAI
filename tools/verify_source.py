#!/usr/bin/env python3
"""Dependency-free QuoaraAi source identity and install-proof preflight."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "baseline": "001T",
    "android_package": "com.imquoara.quoaraai",
    "android_version": "0.4.7-alpha",
    "android_code": "11",
    "backend_name": "quoaraai-backend",
    "backend_version": "1.1.7",
}

errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

def text(rel):
    p = ROOT / rel
    require(p.is_file(), f"missing required file: {rel}")
    return p.read_text(encoding="utf-8") if p.is_file() else ""

pkg = json.loads(text("backend/package.json") or "{}")
lock = json.loads(text("backend/package-lock.json") or "{}")
gradle = text("android/app/build.gradle")
manifest = text("android/app/src/main/AndroidManifest.xml")
network = text("android/app/src/main/res/xml/network_security_config.xml")
android_wf = text(".github/workflows/build-quoaraai-android.yml")
backend_wf = text(".github/workflows/verify-quoaraai.yml")
api_client = text("android/app/src/main/java/com/imquoara/quoaraai/ApiClient.java")

require(pkg.get("name") == EXPECTED["backend_name"], "backend package name mismatch")
require(pkg.get("version") == EXPECTED["backend_version"], "backend package version mismatch")
require(lock.get("name") == EXPECTED["backend_name"], "package-lock root name mismatch")
require(lock.get("version") == EXPECTED["backend_version"], "package-lock root version mismatch")
root_lock = (lock.get("packages") or {}).get("") or {}
require(root_lock.get("name") == EXPECTED["backend_name"], "package-lock packages[''] name mismatch")
require(root_lock.get("version") == EXPECTED["backend_version"], "package-lock packages[''] version mismatch")

checks = {
    "Android namespace": rf"namespace\s+['\"]{re.escape(EXPECTED['android_package'])}['\"]",
    "Android applicationId": rf"applicationId\s+['\"]{re.escape(EXPECTED['android_package'])}['\"]",
    "Android versionName": rf"versionName\s+['\"]{re.escape(EXPECTED['android_version'])}['\"]",
    "Android versionCode": rf"versionCode\s+{EXPECTED['android_code']}\b",
    "source baseline": rf"QUOARAAI_SOURCE_BASELINE.*{EXPECTED['baseline']}",
}
for label, pattern in checks.items():
    require(re.search(pattern, gradle) is not None, f"{label} mismatch")

require('android:usesCleartextTraffic="false"' in manifest, "Android cleartext traffic must be disabled")
require('android:allowBackup="false"' in manifest, "Android backup must be disabled")
require('cleartextTrafficPermitted="false"' in network, "network security cleartext must be disabled")
require("BackendConfig.origin(this.baseUrl)" in api_client, "ApiClient must reuse canonical backend origin parser")

for token in [
    f"source_baseline={EXPECTED['baseline']}",
    f"expected_package={EXPECTED['android_package']}",
    f"expected_version_name={EXPECTED['android_version']}",
    f"expected_version_code={EXPECTED['android_code']}",
    'test -f "$APK"',
    '} | tee "$PROOF"',
    'test -s "$PROOF"',
]:
    require(token in android_wf, f"Android proof workflow missing: {token}")

require("python3 tools/verify_source.py" in android_wf, "Android workflow must run source preflight")
require("python3 tools/verify_source.py" in backend_wf, "Backend workflow must run source preflight")

for rel in [
    "android/app/proguard-rules.pro",
    "backend/supabase/migrations/20260928004000_owner_approval_integrity.sql",
    "INSTALL-PROOF-GATE-001T.md",
]:
    require((ROOT / rel).is_file(), f"missing install/security gate file: {rel}")

if errors:
    print("QuoaraAi source preflight: FAIL", file=sys.stderr)
    for e in errors:
        print(f"- {e}", file=sys.stderr)
    sys.exit(1)

print("QuoaraAi source preflight: PASS")
for k, v in EXPECTED.items():
    print(f"{k}={v}")
