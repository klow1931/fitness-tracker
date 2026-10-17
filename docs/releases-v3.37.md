# Loadnote v3.37 — Phase 1 training foundation

This reviewable release combines v3.35–v3.37 work on top of v3.34.1. Existing completed workouts, kg storage, program prescriptions and history remain unchanged.

## Gym floor
- RPE chips complete a set in one tap, with enlarged mobile targets.
- Completion automatically progresses to the next unfinished set across exercises; resting never opens the numeric keyboard automatically.
- While actively training, the cockpit provides the primary Finish/Review action; existing timers, quick fills, and undo remain.

## Reliability
- Preserve the original local workout draft key and schema. Write a second complete recovery record before each primary save.
- If the primary becomes corrupt, recover the newest valid normalized record. The primary write must succeed to display a healthy save status; the backup is not a substitute for proper persistence.
- Clear both draft copies after the completed workout has successfully persisted. A failed reviewed save keeps the in-progress draft.
- Local redundancy does not provide device-loss backup, account restore, or synchronization.

## Today's Workout
- Recognize an unscheduled workout saved today on both Home and Train.
- Resume unrelated unfinished workouts before starting a new scheduled one. Offer another session after training is logged.

## Validation
- Dual-checkpoint and Today tests cover recovery, chronology, clearing, and legacy compatibility.
- Browser acceptance covers no-interruption exercise progression, offline logging, kg/lb, review/save integrity and reload.
- Physical iOS/Android force-close and storage-exhaustion checks remain required for store readiness.
