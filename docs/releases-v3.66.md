# Loadnote v3.66.0 — Reliable Home Screen Updates

Loadnote v3.66 responds to an iPhone Home Screen installation remaining on v3.62 while the GitHub Pages site and a fresh Safari web app already served v3.65. The failure mechanism on the physical phone was not instrumented, but the previous service worker required every static asset to be downloaded **before** presenting an update, while retaining every prior app-shell cache. That combination can prevent new workers from installing on a constrained browser profile.

## Update and recovery behavior

- Installation caches only the current index bootstrap, limiting disk use before a new worker reaches the waiting state. The app still asks the athlete to save and approve an update; it never silently activates during a workout.
- During activation, the worker removes only old `loadnote-v*` Cache Storage entries, warms the complete app shell, and then claims clients. Cache Storage is for downloaded app code/assets, not Loadnote's workout/backup stores. No training-data erase, service-worker unregistration or automatic Home Screen removal is performed.
- If the complete offline shell cannot be downloaded, the online app remains usable and explains that offline files are incomplete. **Device & backup → Repair offline files** retries the static download without erasing training records. An online cache miss also stores the retrieved static response to help restore offline coverage.
- **Device & backup → Check for updates** requests a fresh worker check, reports offline/check errors and shows a guarded **Save and update** prompt when a newer worker is waiting. A failed installing worker produces visible guidance instead of silently disappearing.
- Multiple open Loadnote windows still block early activation, and existing workout draft and state persistence must succeed before `APPLY_UPDATE` is sent. Native installed builds continue to use signed app updates rather than web service workers.

## Boundaries and acceptance

This is a preventive reliability change, not proof of the exact failure on any particular iPhone. Service-worker cache clearing does not clear Safari/Home Screen local databases, but browser/site deletion can, and iOS keeps these installs' website data separate. **Export and verify a JSON backup before reinstalling or removing a Home Screen copy.** Routine training backups exclude progress-photo images and unfinished workout drafts.

Tests cover staged installation, asset-cache reclamation, offline warm-up and repair, browser update prompts, open-tab activation protection and offline workout continuity. Real iPhone upgrade testing from v3.62/v3.65 with low storage and interrupted downloads is still an acceptance gate. Schema 33 is unchanged; native build number is 33410.
