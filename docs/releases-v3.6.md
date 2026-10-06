# Loadnote v3.6.0 — Train, rest, recover

This focused update uses merged v3.5.0's existing logger, quick RPE controls, previous-set context, one-tap scheduled start and recoverable drafts. It does not introduce another logger or recommendation engine.

Quick completion now validates the active exercise name, positive reps/hold seconds, optional nonnegative load and optional RPE before checking the set or starting rest. Repeated completion of a checked set is ignored. Blank load remains permitted for bodyweight work; missing RPE remains missing. Editing other sets and final workout review retain the existing logger validation path.

While rest is active, quick completion does not focus the next numeric input. This removes an automatic keyboard interruption; it does not prevent athletes from tapping and editing the next set. Exercise transitions and non-rest keyboard navigation retain their existing controls.

The cockpit displays the actual draft-save message and a direct retry when local draft storage fails. The original failure warning stays available. This is device-local draft status, not cloud synchronization, a history save receipt or proof of backup. No new analytics telemetry is sent or stored.

## Acceptance and measurement

`tests/browser/training-loop.spec.js` counts real button clicks in a synthetic scheduled session: one Home click starts a prefilled workout, and one RPE click completes its first set. It checks prior-performance context, preserved prescriptions/history, rest-time input focus, recovery after reload, missing effort after final save, invalid-set rejection and quota-failure retry. Screenshots are kept in CI's training-loop-demo artifact. Tap counts are scenario-specific, not comparative human usability or speed benchmarks.

Physical-device acceptance remains required: iPhone Safari and installed app, actual software keyboard, background/resume, long sessions, interruptions, kg/lb switches, export/restore and storage exhaustion. A browser focus assertion does not establish that every device's keyboard dismisses. Observe elapsed logging time, taps and errors during actual workouts before claiming improved speed or reliability.

The programming, readiness and adaptation engines are unchanged. There is no data migration; release metadata is aligned to 3.6.0/build 30600. Merged v3.5 is the rollback release.
