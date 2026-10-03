# Cloud iOS compilation — v2.86

The **Loadnote iOS compilation** workflow builds the existing Swift Package Manager project on GitHub-hosted `macos-15`. No personal Mac, developer team, signing certificate, provisioning profile or App Store Connect API key is needed for this compilation gate. It complements the Linux browser/domain workflow rather than replacing it.

## What runs

Pull requests, pushes to `main` and manual workflow runs compile two Release configurations:

| Target | SDK / destination | Result |
|---|---|---|
| Simulator | `iphonesimulator` / generic iOS Simulator | Unsigned simulator compilation |
| Device | `iphoneos` / generic iOS | Unsigned device-SDK compilation; cannot install on an iPhone |

Each job installs locked npm dependencies, syncs the native package, verifies the source boundary, and builds the shared `App` scheme in `ios/App/App.xcodeproj`. Xcode resolves Swift packages as part of the build. The runner's Xcode/SDK versions are recorded; this workflow is not a guarantee of compliance with future store SDK requirements.

Signing is explicitly disabled (`CODE_SIGNING_ALLOWED=NO`, `CODE_SIGNING_REQUIRED=NO`, empty signing identity). There is no credential import, developer portal operation, archive export, `.ipa` upload, TestFlight distribution or App Store submission.

After Xcode succeeds, the compiled bundle must contain a Mach-O executable, matching development identifier/release/build number, the correct platform, packaged web/native bridge assets and the app privacy manifest. A live-server override or unexpected app signature fails the check. These checks do not prove the app launches or native plugins work at runtime.

## View the result without a Mac

1. Open the repository's **Actions** tab and select **Loadnote iOS compilation**.
2. Open the latest run for the intended branch/commit. Both **Unsigned iOS (simulator)** and **Unsigned iOS (device)** must pass.
3. Download the diagnostic artifact for either target. `build.log` and `toolchain.txt` are readable anywhere; successful builds also include `build-report.json`. The `.xcresult` bundle is available for deeper Xcode inspection.

Artifacts expire after seven days. Local `build-ios/` output is ignored. Concurrent runs on the same PR/ref cancel older runs; compare the final checked SHA before merging.

On a Mac, reproduce with:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check:native
npm run build:ios:unsigned -- simulator
npm run build:ios:unsigned -- device
```

On Linux/Windows, the build command stops with a macOS/Xcode requirement. Synthetic bundle-validation tests run locally but are not native build evidence.

## Next gate

After both compilation jobs pass, confirm the permanent bundle ID, app record and developer team; configure signing in a protected workflow or selected build service; then prepare a signed TestFlight build. Credentials belong in the service's secret storage, never source code or chat. Physical-device logging, keyboard, offline, draft/upgrade persistence and export/import acceptance remain required under `native-beta.md`.

This release changes build infrastructure and versions only. Training calculations, schema v25, native local-only service guards and the web/PWA behavior remain unchanged.
