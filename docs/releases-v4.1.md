# Loadnote v4.1.0 — Trustworthy Workout Comparisons

## Why this update

v4.0 introduced a concise explanation of what Loadnote learned after saving a workout. v4.1 improves the correctness of that explanation.

A planned RPE cap and the actual RPE from a different performed load or rep count cannot automatically be treated as a directly matched set. An unknown load also cannot be treated as an explicitly performed zero-load bodyweight set.

## Implemented

- **Shared set comparison:** `LoadnoteIntent.sameSet` now rejects missing actual load, missing reps or duration, invalid numbers, negative weights, and mismatched loads when a planned load was captured. The deliberate `0` remains valid for a recorded bodyweight set. Existing rep-range and load-tolerance rules remain in place.
- **Exact-dose RPE comparison:** `LoadnoteAdaptiveHandoff.performance` reuses `Intent.sameSet` before pairing an actual RPE with its target. An actual RPE from a different load or rep count no longer changes the directly comparable average.
- **Identity and equipment guardrails:** Exercise IDs remain authoritative. A missing ID can be matched only by an unambiguous exact name plus tracking mode. Incompatible known load conventions (e.g. total versus per-hand) prevent RPE pairing.
- **Visible evidence gaps:** The post-workout recap reports RPE sets excluded for changed or missing dose and sets that matched the prescribed dose but did not have a valid actual RPE. Missing RPE is not filled with target RPE.
- **Preserve real work:** Recorded changes remain visible in history, are not labeled failures by default, and do not automatically change the future schedule.

## Acceptance gates

1. Exact matching workouts retain paired actual/target effort and v4.0 evidence explanations.
2. Load/reps/duration changes remove that set from directly paired RPE, without removing the actual set from history or changing the program.
3. Missing, blank, and invalid loads cannot be mistaken for 0; explicit 0 remains supported for bodyweight strength sets.
4. Saved workout exercises with a missing ID may resolve to a unique planned name+mode; conflicting IDs and known incompatible load conventions never pair.
5. Missing actual RPE is separately identified. Its target RPE is never counted as measured actual effort.
6. The recap correctly distinguishes matching dose, unmatched dose, and unknown effort on a 390px phone, with no overflow or extra confirmation dialogs.
7. Full Node/static/browser WebKit/Android/iOS checks pass before merging; real-device ergonomics remain a distinct acceptance step.

## Compatibility and safety

Release **4.1.0**, unsigned native development build **36100**, data schema **34** unchanged. Existing history, saved schedule revisions, adaptation-review approvals, and kg/lb storage/display boundaries are untouched. No migration, autonomous programming rule, recovery diagnosis, or new stored data.

Base/rollback: merged Loadnote v4.0.0 (main `ff8492e`). Keep this release on a feature branch until CI validates the new matching contracts.
