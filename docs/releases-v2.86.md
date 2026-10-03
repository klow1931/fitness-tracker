# Loadnote v2.86.0

## Cloud iOS Compilation

- Add GitHub macOS compilation for simulator and device SDKs, a shared App scheme and a reproducible unsigned build command.
- Verify compiled executable, identifier, version, platform and web/privacy resources without importing Apple credentials.
- Retain toolchain metadata, build logs, compilation reports and Xcode result bundles for diagnosis.
- Normalize the generated Windows Gradle wrapper's Git line endings; commands unchanged.

Compilation is distinct from launching, signing, physical-device testing and TestFlight/store delivery. Schema v25, kg storage and training calculations unchanged. See `ios-cloud-build.md`.
