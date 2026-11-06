# Loadnote v7.0.0 — Clearer workout review and corrections

Version 7.0.0 · unsigned native build 39000 · training schema 34 unchanged.

## Behavior

Workout review shows each included strength set on its own line, preserving its original set number even when earlier prescribed targets are excluded. Load, reps or duration and actual RPE use the existing formatting and unit conversion. Cardio retains its recorded duration, distance and heart rate display.

Recording notes identify included strength sets without actual RPE and unchecked prescribed targets excluded from saving. Missing RPE remains optional. These notes make no estimates of unrecorded effort. Manual entries and saved-session edits retain their existing inclusion rules.

Each included exercise offers Edit exercise. It closes review and expands/focuses the same logger row, preserving the actual input nodes, completion flags, date, notes, unit, prescription and edit identity. The athlete reopens review before saving corrections. Mobile review keeps Back and Save actions visible while scrolling.

Duplicate detection, stale-review checks, durable-save ordering, retry after storage failure, revision history and post-workout adaptive handoff remain owned by the existing session workflow.

## Architecture and rollback

`workout-review-sets.js` projects each draft row through `LoadnoteSession.fromDraft`, the existing serialization authority, and adds read-only source indices and recording counts. `workout-review-sets-ui.js` owns presentation/navigation. Both ship in the service-worker cache and native bundle. No storage shape or progression engine changes; no migration is needed.

Merged v6.9 commit `755afb5` remains the rollback baseline. This release is validated separately before main is changed.

## Validation and limits

Node coverage checks prescription versus manual/edit inclusion, original indices, missing effort, kg/lb conversion, timed strength, cardio and nonmutation. Browser coverage checks readable narrow/enlarged-text review, correction without saving, actual persistence after correction, and failed-save recovery. The complete Node/static/mobile/native/beta checks and CI browser/native suites are release gates.

Native builds remain unsigned and local-only. Browser emulation and WebKit checks do not establish physical-phone acceptance.
