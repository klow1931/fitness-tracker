# Loadnote v2.81.0 — Hands-Free Workout Logging

## What changed

- Voice Companion can now record the athlete’s current unsaved strength set through the existing workout form and draft pipeline.
- Natural voice may provide load, reps or hold duration, and actual RPE; completed voice entries advance the same workout flow used by touch input.
- Partial voice entries remain incomplete so Coach can ask for missing RPE instead of inventing effort data.
- The most recent voice entry can be corrected or undone, restoring the prior draft values.
- A compact in-Companion confirmation shows the most recent voice-entered set with an Undo action.
- Immediate duplicate set completions are suppressed so one repeated realtime tool event cannot accidentally log the next identical set.

## Data integrity

- Voice writes only to the active unsaved workout draft. It cannot edit saved workout history.
- Existing logger input/change events remain the persistence path; no second workout-storage engine was introduced.
- Load units are explicit. Voice never infers kg vs lb from the size of a number.
- Display load is converted for the current UI unit while the logging result also carries explicit kg evidence.
- Actual RPE remains separate from target RPE. Target RPE is never copied into actual RPE.
- Voice cannot delete exercises/sets or alter prescriptions, training maxes, programs, adaptations, phase progression, or Decisions state.
- Schema remains v25; no migration.

## Voice behavior

- `log_current_set` records a clearly stated performed set and marks it complete.
- `update_current_set` records partial information without completing the set.
- `correct_last_voice_entry` can change only the most recent voice-entered set.
- `undo_last_voice_entry` restores that set to its pre-voice draft state.
- Existing read-only workout context, secure Coach questions, and rest-timer tools remain available.

## Validation

Release validation includes syntax/static checks, the full unit suite, mobile packaging checks, and the full desktop/mobile Playwright suite. Coverage specifically includes kg/lb conversion, RPE validation, missing-RPE preservation, draft autosave, correction, Undo, duplicate suppression, and confirmation that saved workout history is not mutated by voice entry.
