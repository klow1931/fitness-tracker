# Android v3.73 beta acceptance — tester checklist

## Automated disposable-emulator gate

1. On a Windows PC with Android Studio, use a newly created **disposable** Pixel emulator. Never point the synthetic test script at a personal device.
2. Run `npm ci`, `npm test`, `npm run check`, `npm run check:mobile`, `npm run check:native`, `npm run check:beta`.
3. Build the Android beta using `npm run build:android:beta`; set `ANDROID_SERIAL` to the confirmed **emulator-####** identifier and run `npm run test:android:emulator -- --disposable-beta` after the required debug and androidTest APKs are built. Review `build-android-emulator/acceptance.json`.
4. The instrumented journey checks offline workout logging, native cache-backed backup fingerprint, preview/cancel/restore, athlete-authored weekly self-report, non-changing Calendar prescriptions, cold launch and activity recreation.

This test deliberately clears **only** a disposable emulator's `.beta` app data. The script refuses physical hardware and non-emulator serials. It does not verify production authentication, external sharing apps, the system file picker or real device ergonomics.

## Physical Android tester (manual, no destructive reset)

Before testing: record device/Android version, secure an exported and verified backup, and use a test account or test plan. Do **not** uninstall an installation holding irreplaceable athlete data. For beta builds, confirm the app ID and signing/update channel match the existing install before attempting an in-place upgrade.

| Check | Pass criterion | Evidence to capture |
| --- | --- | --- |
| Update and cold launch | Version 3.73.0, prior workout and PR counts unchanged | Version, before/after counts |
| Offline workout | Start, log, save, force-stop and relaunch with airplane mode enabled; log persists | Date, exercise and set count |
| Personal program | Import locally, review targets/units and schedule explicitly | Program week count, no invented load |
| Weekly review | Completed/unconfirmed/skipped clearly distinguished; check-in survives relaunch | Week and review count |
| Controlled edit | Copy the program, confirm future-only replacement and verify no historical session changed | Dates, preserved count |
| Backup and restore | Export, fingerprint verify, review import and restore only into a disposable profile or test install | Verification and preflight outcome |
| Accessibility and layout | Keyboard, TalkBack, text scaling, large tap targets, landscape/portrait and Android back navigation | Issues and screenshots |
| Network/privacy | Works without a network and does not transmit imported files or check-ins without chosen account sync | Offline result / network observation |
| Device integrations | Test Share sheet and system picker on physical hardware | Pass or documented limitation |

## Beta release blockers

- Any silent deletion/rewriting of workouts, PRs, schedule history or personal weekly check-ins.
- An unverified backup claimed as restored, missing/invalid check-in collection accepted as schema 34, or update that strands an offline installation.
- Offline workout save failure, incorrect lbs↔kg targets, duplicated session logs, or a Coach response presenting an unconfirmed session as completed.
- An accepted program modification without explicit athlete review of the exact future dates and targets.
- Missing privacy, permission, signing, store declaration or physical acceptance review for Play distribution.

File reproducible issues with app version, exact steps, device details and **redacted** screenshots/logs. Training notes and uploaded source files remain the athlete's unless separately shared with consent. A green CI badge alone does not mark this manual checklist complete.
