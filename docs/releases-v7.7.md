# Loadnote v7.7.0 — Reliable releases and clear update status

Version 7.7.0 · unsigned native build 39700 · schema 34 unchanged.

Device & backup shows the installed app version separately from offline-file readiness. Check for updates fetches the live version without a cached fallback. It distinguishes the current release, a newer live release still preparing, an update ready to apply, a newer installation than the live release, offline use and an unverified live version. Native builds explain that their bundled assets update through a new app build. Checking never activates an update; Save and update retains the existing draft/persistence and other-tab guards.

The focused app-version module owns version comparison, status copy and the uncached manifest request. The lifecycle module retains registration and activation. No training policy, history format, weight convention or migration changes.

The release preparation command validates every known marker before writing, previews changes with --dry-run, restores originals if a write fails, rejects backwards versions/builds and keeps completed release notes/changelog entries. It updates package/lock, core/release/footer/cache, Android/iOS and beta versions together and creates notes for a new release. Developers still fill in release behavior, validation and the rollback baseline before review.

release.json pins SHA-256 hashes for all service-worker app assets and sw.js, including generated offline readers. Run npm ci before preparing or refreshing it. The manifest itself is network-only and is never evidence that offline files are complete. Pages checks the source manifest before packaging, includes it in the deployment, then verifies the live manifest and all listed files against the committed release. Bounded retries allow propagation; a mixed, missing or stale deployment fails the workflow. This detects a faulty deployment after publication; it does not automatically roll back Pages or certify installed devices.

Main checks now cancel superseded runs on the same branch/PR. Pages continues serial deployment without cancelling an active publication. Existing automated mobile review includes actual service-worker upgrades and kg/lb draft recovery alongside its beginner journeys.

Rollback baseline: merged v7.6 and automated mobile review commit bc3025432502fcfd0a36cbfd970685f1eea4ba76. Keep this release isolated until validated and merged by the user. To republish a rollback for installed clients, prepare a higher patch version with the previous behavior; browsers will not downgrade a running shell automatically.

Validation covers numeric version ordering, honest unknown/offline states, uncached checks, native update messaging, failed draft/persistence guards, metadata consistency, preparation idempotence/write rollback, stale/mixed/missing deployed files, real service-worker updates with unfinished kg/lb entry, offline reload recovery and narrow enlarged-text layout. Full Node/static/mobile/native/beta checks, Chromium/WebKit suites, native compilation, Android emulator and CodeQL remain release gates. Physical phone acceptance remains outstanding. The live Pages verifier can first verify v7.7 after this PR is merged and published.

For future releases:

```sh
npm ci
npm run release:prepare -- --version 7.8.0 --build 39800 --title "Release title" --dry-run
npm run release:prepare -- --version 7.8.0 --build 39800 --title "Release title"
# Complete release notes/changelog; after further app-asset edits:
npm run release:manifest
npm run release:check
npm run check
npm test
npm run check:mobile
npm run check:native
npm run check:beta
```

Browser/mobile/native CI must also pass before review. To verify an already published release, run npm run release:verify -- followed by its HTTPS app URL. An older local checkout intentionally fails verification against a newer deployment.
