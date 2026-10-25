# Loadnote v4.2.0 — Next Session, At a Glance

## Focus
Improve the transition **Home → Train → Log** without creating new screens or additional taps.

v4.2 brings **Target vs last logged set** to the existing Today and Train start surfaces when an eligible strength workout is scheduled. Its source is the current Calendar prescription, not an inferred or automatically generated load.

## Behavior
- Show the first supported scheduled strength exercise, its first known load/reps target (plus target RPE when captured), and the last usable logged load/reps/RPE for the same exercise.
- Display uses the selected kg/lb unit, while stored plan and performance loads remain kilograms. Explicit 0 is a valid bodyweight load; missing actual load and missing actual RPE remain unknown.
- Historical lookup requires matching exercise identity and tracking mode, excludes unknown/different load conventions when both are known, and excludes future or post-cutoff training. Duplicate same-identity entries in one workout are not silently resolved.
- If no matching earlier set exists, say so; do not invent a previous performance or assert training progress.
- Never display a planned-dose preview in place of an unfinished draft, while a linked workout is in progress, or while a program review gate takes precedence.
- Keep the existing primary **Start / Resume / Review** action in its place. The context is compact, read-only, and does not modify training data.
- Existing in-workout cockpit context and full **Why this workout?** details remain available; no duplicate decision engine or new progression policy is introduced.

## Checks
- Unit regression cases: exact exercise IDs, ambiguous duplicates, prior dates and created-at cutoffs, kg storage, zero weights, missing RPE, missing targets, and draft priority.
- Browser acceptance: Home and Train context, one-tap start, lb display without changes to kg storage, draft recovery, and mobile width.
- Full project Node/static, desktop/mobile browser, selected iPhone WebKit, Android, iOS and Android beta/offline checks must pass before merge; physical phone testing remains separate.

## Release integrity
Version **4.2.0**, unsigned native build **36200**. Schema **34**, no migration. No modification to saved workouts, approved schedule revisions, decision thresholds, fatigue calculations, e1RM, or training-max math. Preserve merged v4.1.0 on `main` as the rollback point until this release is validated.
