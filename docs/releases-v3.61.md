# Loadnote v3.61.0 — Intent, Recovery & First-Workout Reliability

Status: engineering release candidate following merged v3.60. This work targets issues reproduced from ordinary Coach phrases and a field-level backup-preservation test; it is **not** evidence of physical-device acceptance or production release approval.

## Coach that recognizes what the athlete asked

- “Set my equipment to dumbbells and bench” proposes **bench** under the main lift setup and **dumbbells** under accessory equipment. A complete current-versus-proposed Profile review is required, with no changes until a fresh athlete Save. This deliberately replaces the requested equipment selections rather than silently inventing access to racks/plates.
- Supported exact equipment vocabulary includes barbells, plates, rack, bench, dumbbells, cables, machines, bodyweight, pull-up bar and cardio equipment. Ambiguous or unsupported equipment lists produce a clarification, not a Bench Press explanation or automatic preference write.
- “Create a 20-week meet prep three days per week 60 minutes full gym” now starts the existing reviewed 20-week strength/meet-prep path even without saying *program*. Meet type and actual event date still require review. Multi-turn “Make it meet prep” continues the current draft rather than resetting its duration.

## Restore preflight preserves content, not merely counts

- Compare the source’s original values recursively across workouts, sets, exercise names and existing IDs, PR values, workout revisions (including prior/updated payloads), Calendar sessions, templates and other persisted collections. Record additions used for migration-derived defaults and catalog identities are permitted; changes to fields already present in the backup are blocking.
- Report the field paths that fail, with bounded issue details, before any replacement. File integrity fingerprints, local-change detection, recovery snapshots and a separate explicit import confirmation remain in force.
- Synthetic tests deliberately alter an exercise name, PR weight, revision action and set values while keeping record IDs/counts fixed. All are blocked.
- A privately supplied September schema-22/lb export was inspected **read-only** after normalization: 20 workouts, 11 revisions, 30 PRs and lb preference survived the deeper comparison with zero detected changes. No raw athlete export is stored in GitHub or CI.

## Beginner daily-workout guidance

- The existing full editor remains available, with a new optional four-step guided path: **choose movements → enter fresh loads → review sets/reps/RPE/rest → confirm and preview**.
- “I don’t know my starting weight” explains conservative, individually chosen loading without producing an ungrounded number. RPE 6/7/8 examples are approximately 4/3/2 repetitions in reserve, not proof of readiness or a medical recommendation.
- All original guards remain: selected movements and equipment, explicit loads, time allowance, schedule conflict separation, confirmed starting targets, stale-preview checks and draft-only loading. No workout is completed or saved to history by reviewing it.

## Release gates

- Unit, syntax, browser, Android and iOS build checks must pass. See [v3.61 athlete pilot](v3.61-athlete-pilot.md) for sign-off evidence.
- Physical Android/iPhone cold-restart/offline/restore testing, a consent-based small athlete pilot, production hosting, signing and store approval are still outstanding. They cannot be proven by simulated browsers or emulator-only checks.
- Internal kilograms and schema version **32** are unchanged. Native build **33405** is an unsigned-development candidate until real distribution gates pass.
