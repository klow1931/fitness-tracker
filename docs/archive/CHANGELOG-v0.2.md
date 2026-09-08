# Loadnote v0.2 — Foundation

This release is the first development pass under the new Loadnote architecture.

## Included

- Added `src/core/loadnote-core.js` with deterministic, reusable core primitives.
- Added schema versioning (`schemaVersion: 2`).
- Added v1 → v2 data migration that preserves existing records and repairs missing IDs.
- Added stable UUID IDs for new records where supported, with a safe fallback.
- Added `src/training/analytics.js` with deterministic training analytics primitives:
  - estimated 1RM (optional RPE-aware estimate)
  - volume
  - average RPE
  - exercise history
  - exercise strength trends
  - volume trends
  - plateau signals
  - training status
  - dashboard summary
- Integrated the core 1RM and volume calculations into the existing app without changing the UI.
- Integrated stable IDs into newly saved workouts and PRs.
- Added Node-based regression tests in `tests/core.test.js`.
- Added `npm test` and `npm run check` scripts.
- Updated package version to `0.2.0`.

## Compatibility

Existing Loadnote data is retained. The migration only adds missing IDs and a schema version marker.

## Not included yet

- Backend AI API
- Accounts/cloud sync
- Adaptive programming UI
- App Store release configuration
- Full `app.js` module split

Those are intentionally deferred to later sprints so the existing product remains stable.
