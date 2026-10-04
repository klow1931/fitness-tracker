# Android cloud compilation

GitHub workflow **Loadnote Android compilation** builds the locked Capacitor 7 project with JDK 21, Android API 35/build-tools 35.0.0 and the checked-in Gradle wrapper. This is a development baseline, not a claim of compliance with current Play submission requirements. Official references: [Capacitor 7 requirements](https://capacitorjs.com/docs/v7/updating/7-0) and [Android command-line builds](https://developer.android.com/build/building-cmdline).

With these tools installed:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check:native
npm run build:android:unsigned
```

The build removes the previous unsigned APK, compiles `:app:assembleRelease`, checks ZIP integrity, compiled DEX, app ID/version, merged SDK/permissions/backup/cleartext settings and required packaged web resources. It rejects live-server configuration and signed APKs. Dependency compilation errors or unexpected merged permissions fail CI rather than silently weakening these checks.

Only logs, toolchain metadata, merged manifest and build report are uploaded for seven days. The unsigned APK, keystore and training data are not uploaded. No signing secrets, credentials, emulator launch, phone installation or store distribution are configured. A passing build is not evidence of keyboard, file-picker, plugin or persistent-storage behavior on hardware. Follow `native-device-acceptance.md` before beta approval.
