# Loadnote v3.58 — Phase 6: Data Integrity and Athlete-Beta Infrastructure

Built incrementally from merged, validated v3.53. **Phase 6 source engineering is not a claim that production hosting, signed store distribution, or physical-athlete acceptance has been completed.**

## v3.54 — Durable offline sync metadata
- New focused `src/product/device-records.js` prevents a stale IndexedDB record from overriding a newer localStorage fallback after an IndexedDB write failure.
- Fallback markers are read first, legacy device records are migrated, damaged fallback records block sync, and an unavailable IndexedDB base is never silently treated as if the device had never synced.
- These records remain device-only and are not recursively included in cloud sync.

## v3.55 — Protect workouts during slow synchronization
- A sync commit returns the fingerprint of the local training state from which it was prepared.
- Immediately before applying the remote response, account UI verifies the same athlete account and local training fingerprint; a late workout change leads to a visible retry rather than an overwrite.
- `LoadnoteStateStore.applySyncedState` independently checks the expected fingerprint before and after its asynchronous persistence. If new training is entered during the write, it re-persists that newer training and refuses to publish the old overlay.
- Serializes in-progress conflict/first-link commits and provides an actionable error state on network failures. The UI only claims a recovery snapshot if incoming data was actually applied.
- Cloud merge continues to be explicit and conflict-first; no automatic last-write-wins or implicit web-to-native transfer.

## v3.56 — Single-node server snapshot durability
- New `backend/atomic-file.js` shared by account and training snapshot stores. Writes use exclusive, restricted-permission temporary files, file flush, atomic rename, directory flush and cleanup on failure. Deletion also flushes the parent directory.
- The backend still requires an explicitly configured **durable hosting volume**, external tested backups and one writer process. Fsync is not a distributed transaction, database or complete disaster-recovery plan.

## v3.57 — Athlete-beta validation
- `npm run check:beta` checks version, offline assets, device-storage protections, local-only native boundaries, backend shared durability code and documented manual acceptance gaps. It is wired into the CI smoke workflow.
- `docs/phase6-athlete-beta-acceptance.md` provides a measurable physical-device acceptance plan, privacy handling, severity-based rollout stops and production hosting prerequisites.
- Beta build number advanced to 33402 for Android and iOS app-upgrade testing. The native services configuration remains **local-only**, and app-store readiness remains false.

## v3.58 — Regression suite and release gates
- New Node tests for fallback precedence, corrupted/locked sync-base records, migration, receipt fingerprints, server restart/deletion and restrictive file writes.
- New Chromium browser tests for state fingerprint mismatches and workouts entered while a sync apply is in flight.
- No stored workout schema change or kg/lb conversion change. v3.53 remains the rollback version pending green CI.

## Required validation and what remains
The complete unit/static suite, browser shards, iPhone WebKit, mobile/native checks, unsigned iOS/Android compilation and Android emulator beta must pass before merging.

**Not yet completed by this release:** real signed Android/iOS builds on personally tested phones, an independently restored infrastructure backup, multi-instance transactional cloud storage, live OIDC production hosting, app-store privacy/signing approval, or human athlete trial data. These remain explicit deployment gates, not silently accepted features.
