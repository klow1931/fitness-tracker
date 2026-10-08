# Test Loadnote Beta on Windows

Use disposable synthetic data initially. Your iPhone PWA data does not automatically appear in the Android app; keep that original installation and export an external JSON backup before any migration. This is a development test, not Google Play distribution.

## Download and install without compiling

1. Install Android Studio from [Android Developers](https://developer.android.com/studio). Open Device Manager, create a virtual phone with an API 35 Google APIs x86_64 image, and start it. Enable Windows virtualization if Android Studio asks; see [emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration).
2. In the repository's **Actions → Loadnote Android beta**, select a successful run for the intended commit/version. Download the **loadnote-android-beta-…** artifact while it is available (14 days). Extract the ZIP. Do not choose the diagnostic-only artifact or an unsigned release.
3. Check `build-report.json`: version, `.beta` app ID, `debug-beta`, `signed: true`, and `storeReady: false`. Its `acceptance.json` states the actual emulator coverage and remaining device limitations. Verify the APK checksum in PowerShell with `Get-FileHash .\loadnote-3.21.0-android-beta.apk -Algorithm SHA256` against `SHA256SUMS.txt`.
4. Drag the extracted APK onto the running emulator to install it, then open **Loadnote Beta**. Android's [installation guide](https://developer.android.com/studio/run/emulator-install-add-files) explains APK drag-and-drop. No Play Console account is required for this local development installation.
5. Complete setup/intake, create a small workout, save it through review, start another draft, close/reopen, and test airplane-mode launch. Test JSON export to an external destination and reviewed restore separately; automated cache tests do not prove those UI flows.

The app's production identity remains `app.loadnote.mobile`; the debug beta is `app.loadnote.mobile.beta`. Neither shares data with the iPhone/browser sandbox.

## Updates and signing: protect your data

CI uses an automatically generated debug certificate, which may differ between runs. A newer download can fail to update with a signature mismatch. **Do not uninstall, clear app data or change IDs to get around that if the beta contains valuable training.** Keep the working app and a verified external backup. Use a new disposable emulator for different CI builds, or build locally with the same owned development certificate for ongoing testing. The automated update check installs the same artifact again; it does not establish cross-CI-run or production-upgrade compatibility.

For a stable local Windows build, clone the repository, install Node and JDK 21/Android SDK baseline API 35 and build-tools 35.0.0, run `npm ci` and `npm run check:native`, then open `android` in Android Studio and select the **debug** variant. Android Studio's Gradle task `:app:assembleDebug` produces `android\app\build\outputs\apk\debug\app-debug.apk`. Keep the development key private and consistent; never commit/upload it. The cloud beta script itself uses Linux SDK utilities and is not presented as a Windows-native command.

## Automated acceptance on a disposable emulator

The GitHub beta workflow handles this automatically. The runner requires an emulator serial and `--disposable-beta`; it clears only the `.beta` sandbox, installs test fixtures, disables network connectivity temporarily, and restores it afterwards. Do not run it against your personal training install. Reports contain synthetic evidence only.

Physical keyboard/touch, Android Back, large text/TalkBack, external file chooser/share cancellation, device performance and real-device upgrade behavior remain manual release gates. See [device acceptance](native-device-acceptance.md). Store identity, stable production signing, current submission SDK requirements and privacy declarations must be approved before Play distribution.
