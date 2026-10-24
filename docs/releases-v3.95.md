# Loadnote v3.95.0 — Beginner Usability and First-Week Follow-Through

## Objective
Reduce friction between a new lifter's first saved workout and their next training session, while making the existing three-question starter plan less ambiguous.

## What changed
The read-only First Week card now distinguishes:
- **Workout saved today:** View the saved session; do not imply a second workout is necessary.
- **One or two saved sessions on earlier dates, with no scheduled next session:** Offer **Log your next workout**, plus **See previous workout** so the athlete can recall recent weights and reps. No draft is started or completed until the athlete chooses to train.
- **Scheduled sessions, active drafts, conflicting dates and overdue items:** Respect the existing Today/Calendar routes instead of guessing the next workout.
- **Three sessions or beyond the first actual week:** Hide beginner guidance as before.

The v3.93 three-choice starter builder now explains its day selection in context: e.g., “3 days selected · 12 planned workouts over four weeks.” Invalid selections are visibly and accessibly identified. The preview is still editable and must be reviewed before an explicit save; scheduling remains a separate athlete-confirmed step.

## Integrity
No changes to the logger, RPE, estimated 1RM, load conversion, approved adaptive programs, fatigue calculations, stored workout history or schema. New guidance uses existing verified read-only evidence.

Added unit and real-browser regression tests for day/date boundaries, saved versus unfinished work, previous-session access, selection feedback, and no automatic creation of training data.

Version **3.95.0**, unsigned mobile beta **35500**, schema **34** unchanged; preserve merged v3.94 as rollback until full Node, static, browser, iPhone WebKit, native and installed-offline acceptance checks pass.

## Usability acceptance suggestion
Have five to ten new lifters attempt the first two sessions with no coaching, observe where they hesitate, then prioritize issues by taps/time to first saved set and whether workout two can be started unaided. These goals are not represented as measured results.
