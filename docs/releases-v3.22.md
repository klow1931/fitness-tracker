# Loadnote v3.22.0

Audit remediation release. Schema remains 32; existing kg storage, workout identities, confirmed lift roles and reviewed training policies are preserved.

## User-visible fixes

- Imperial plate calculations use 45/35/25/10/5/2.5 lb plates. Metric calculations use 25/20/15/10/5/2.5/1.25 kg plates. Remainders are per side and the actual loaded total is shown.
- Reimporting an unchanged nutrition backup no longer reports a generated migration ID as a deleted and added day. Multiple rows without IDs remain visible in the preview.
- Unmapped lift questions in Coach offer **Confirm lift mappings**, opening the existing review form. Suggestions still require explicit confirmation; chat never silently maps a lift.
- Legacy goal/program cards and advice render imported/user text safely and pass record IDs as data, including numeric and string IDs.
- Duplicate unavailable goal guidance is suppressed in the program designer.
- Privacy, support and data/account deletion instructions are linked in Tools and bundled for offline/native access.

## Server hardening

Static routing now validates decoded segments and the resolved real path against the public allowlist. Encoded slash/backslash traversal and public-directory symlinks cannot expose backend, configuration or account files. Regression tests cover the reproduced backend-source leak and synthetic private-file/symlink targets.

Logout records a session revocation durably before reporting success. Replaying its cookie or bearer token is rejected, including after restart. Invalid or corrupt revocation storage fails closed. The default revocation file is `<account-store-path>.revocations.json`; set `LOADNOTE_SESSION_REVOCATIONS_PATH` to override. Preserve this file across deploys and keep it writable only by the service account. This file adapter supports one process; replicated deployments require a transactional shared adapter for accounts, sync and revocations.

Paid Coach and realtime voice setup share limits: 6 upstream calls/account/minute, 100/account/UTC day, 1,000 globally/UTC day, and 4 concurrent upstream calls. Override with positive integers `LOADNOTE_AI_REQUESTS_PER_MINUTE`, `LOADNOTE_AI_REQUESTS_PER_DAY`, `LOADNOTE_AI_GLOBAL_REQUESTS_PER_DAY`, `LOADNOTE_AI_MAX_CONCURRENT`. Invalid settings fail startup. Limits apply before upstream fetch, include provider failures and hold concurrency through response parsing. Unauthenticated development calls use socket IP, not untrusted forwarded headers. Limits are process-local and reset on restart; they are not a durable monetary budget. Use provider account spending limits and shared durable quotas for a public multi-instance service. Realtime session creation limits do not cap subsequent audio streaming spend.

Baseline CSP blocks plugins, foreign base URLs, arbitrary script hosts and backend framing. It permits legacy inline handlers, selected CDN scripts, HTTPS/WSS connections for configured providers/model downloads, and WebAssembly compilation. It is intentionally not a strict XSS-proof CSP; eliminating inline handlers and pinning every optional external runtime is a separate migration. Public unexpected server failures no longer expose internal filesystem/error details.

## Dependency and asset builds

The npm audit found nine build-tool advisories, including an unpatched braces dependency in the Tailwind 3 compiler chain. That executable development chain is removed. `assets/tailwind-baseline.css` preserves the approved 3.4.17-generated utility CSS byte for byte under the included MIT license, verified by SHA-256 during `npm run build:assets`; current app layouts are unchanged. That command restores the baseline and copies locked Chart.js assets. Historical `assets/input.css` and `tailwind.config.js` are provenance, not executed build steps. Define future style additions in `styles.css` or `energy.css`. Replacing the utility baseline/compiler requires a separate browser/WebView compatibility and layout review. The remaining brace-expansion dependency is updated to its patched release. No npm audit finding is hidden with an exception or omitted-dev-only check.

## Android release preparation

Build 32200 targets/compiles API 36 with AGP 8.10.1 and Gradle 8.11.1. CI compiles the unsigned APK, validates an unsigned AAB with checksum-pinned bundletool 1.18.2, and runs the separate local-only beta journey on an API 36 emulator. No production key is generated or committed.

Run `npm ci`, `npm run check:native`, `npm run setup:bundletool`, then `npm run build:android:aab`. Requires JDK 21 and Android SDK platform 36/build-tools 36.0.0. The unsigned output is not uploadable to Play.

For an owner-signed upload bundle, provide all four environment variables through a private shell/secret manager: `LOADNOTE_ANDROID_KEYSTORE` (absolute path), `LOADNOTE_ANDROID_KEYSTORE_PASSWORD`, `LOADNOTE_ANDROID_KEY_ALIAS`, `LOADNOTE_ANDROID_KEY_PASSWORD`. Then run `npm run build:android:aab:signed`. Keep the same upload key for future updates; retain a secure offline copy. Do not send key files/passwords through chat or commit them. Signed output is verified, but does not certify device behavior or Play acceptance.

## Remaining owner acceptance gates

- Supply a verified confidential support/privacy contact and publish the final policy at an accessible HTTPS URL. Public GitHub issues are unsuitable for sensitive records. Review the policy against the precise distributed binary and any enabled web services.
- Test signed release builds on physical devices, including API 36 navigation/insets, offline cold start, save/reopen, external backup/restore, photo handling and upgrade from the previous signed build. Follow `docs/native-device-acceptance.md`; emulator evidence does not fill physical rows.
- Configure Play App Signing/upload key and Play Console identity, Data safety, health-app declaration, content rating, store listing and test-track requirements applicable to the owner account. Submit the local-only build with accurate enabled-feature disclosures.
- Verify all CI jobs on the final PR head. This document does not claim checks or store review have passed.

The release is a reviewable candidate, not a certified Play submission. The owner/account/device gates cannot be completed from source code alone.
