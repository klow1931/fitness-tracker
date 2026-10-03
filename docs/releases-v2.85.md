# Loadnote v2.85.0

## Native Beta Foundation

- Generated unsigned Android and iOS (Swift Package Manager) source projects with existing development ID and Loadnote branding.
- Added native JSON/photo system sharing with cancellation-safe backup reminders; native CSV explicitly unavailable.
- Kept account, cloud, online AI and voice unavailable in the native beta; excluded browser service-worker updates from packaged apps.
- Narrowed Android sharing to export cache, disabled automatic backup/cleartext traffic, and bundled the iOS filesystem privacy reason.
- Added reproducible native synchronization, version checks, boundary tests and device acceptance documentation.

Schema v25, kg storage and training calculations are unchanged. No native compilation, signing, physical-device acceptance, TestFlight/Play distribution or store readiness is claimed. See `native-beta.md`.
