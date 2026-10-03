# Native beta foundation — v2.85

This is an **unsigned development source release**, not an installable store beta or certification. The existing training engine and schema v25 are unchanged. Android and iOS package the same local-first web application under the development ID `app.loadnote.mobile`.

## Reproduce the source projects

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm run check:mobile
npm run check:native
```

`check:native` builds the web assets, syncs Capacitor plugins and release versions, then checks source configuration. It does **not** compile Swift/Java, run an emulator, sign a binary or prove plugin behavior on a device. Generated web copies, local SDK paths and build outputs remain ignored. Icons/splash images are derived from the existing Loadnote icon; optional regeneration uses `python scripts/build-native-assets.py` with Pillow installed.

## Open and build on the right machine

- Android: `npm run native:android`, or `cd android && ./gradlew assembleDebug` after installing JDK 21 and the Android SDK. The generated Capacitor 7 project currently uses compile/target API 35 and minimum API 23. This is a development baseline, **not a current Play submission target assertion**. Review/upgrade SDK, Gradle and dependencies together before store submission.
- iOS: on macOS with compatible Xcode (Capacitor 7 documents Xcode 16+), run `npm run native:ios`. Open `ios/App/App.xcodeproj`; this project uses Swift Package Manager, not a CocoaPods workspace. Resolve dependencies, select a simulator or device, and choose your own development team locally for device signing. No team or distribution identity is provided here.
- Never commit keystores, signing passwords, provisioning profiles, certificates or local SDK paths. Confirm final identifiers and developer-account ownership before creating store records. Changing IDs after installing creates a different data sandbox.

## Deliberate beta boundaries

- Training records/drafts remain local. Browser/PWA data does **not** automatically appear in the native app: export a JSON backup in the browser, then import it through the existing reviewed restore flow in the native app.
- Sign-in, account deletion, cloud sync, online AI and voice are unavailable in this native beta. The account transport fails closed before sending requests, and no native microphone/camera/location/health permissions are declared. External food lookup and other browser-only integrations are not certified native features.
- Packaged assets do not register the browser service worker or load a development server. Updating native assets requires a new app build/install. The web/PWA update path remains unchanged.
- JSON export writes a temporary private cache file, then opens the system share sheet. Choose a trusted destination such as Files and confirm the file exists. Share-sheet completion/cancellation cannot establish durable delivery, so it does not clear backup reminders or advance the last-export date. Photo export has a separate JSON share path; routine training backups still exclude image binaries. Native CSV export is explicitly unsupported instead of claiming a download succeeded.
- Android file sharing exposes only the export-cache subdirectory, not the entire sandbox. Broad storage permissions and Android automatic app backup are disabled. Local app data is not claimed to be encrypted. Uninstalling, clearing app storage or switching IDs may erase it; a verified external backup is essential.
- The iOS privacy resource includes the filesystem timestamp API reason C617.1. This is not a substitute for auditing the final binary, SDK manifests, privacy policy and store disclosures.

## Physical-device acceptance gate

All rows below are **not yet run** on native hardware. Record OS version, device, build number, result and any issue before approval.

| Check | Required evidence |
|---|---|
| First launch / branding / navigation | Android and iPhone screenshots; no blank screen; back navigation and safe areas usable |
| Workout logging / keyboard / RPE / units | Complete and review a session; pound display round-trips to kg storage correctly |
| Draft and saved-data persistence | Background/foreground, force-stop/relaunch and same-ID app upgrade preserve data |
| Offline launch and training | Airplane-mode cold launch and complete local workout |
| JSON export / cancellation / restore | Save to Files, inspect JSON, restore in a separate test install; cancelling never dismisses backup warnings |
| Photo backup and file picker | Save separate photos JSON; restore flow remains explicit; no unexpected broad permission request |
| Local-only account boundary | Account/cloud/online AI/voice stay unavailable; no sign-in/microphone prompts |
| Screen sizes and accessibility | Small Android, notched iPhone, large text, VoiceOver/TalkBack and touch targets |
| Release binary / privacy | Compile both platforms, inspect merged permissions/manifests and review distribution signing |

After this gate: approve production identities, provision developer accounts/signing, update platform dependencies for current store rules, then distribute through the chosen private testing channels. Do not submit this foundation to stores as if those gates passed.
