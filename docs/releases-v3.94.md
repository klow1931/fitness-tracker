# Loadnote v3.94.0 — Guided First Week

## Objective
Help a new lifter continue after first-run onboarding and the optional v3.93 four-week starter-plan preview, without creating another logger or automatically advancing training.

## Behavior
Home's existing Today card now includes a small **Your first week** section only after the athlete selects the beginner log or plan route. It identifies (from already validated saved data) unfinished logging drafts, a scheduled session today, unresolved earlier scheduled sessions, the next confirmed Calendar session, or an unscheduled saved workout. A single button uses the corresponding existing Train, Calendar, or History action.

- Saved workouts are counted only when dated on or before the current local day and containing recorded repetitions/duration. Planned targets alone never count as completed.
- The guide stops after the first three saved workouts or seven days from the first actual recorded workout. It does not persist a new training status or increment a counter.
- An unfinished draft is prioritized over a scheduled session. An unresolved earlier Calendar entry is *not* treated as missed. Future sessions are presented as a plan, not training evidence.
- The guide never creates a session, fills a training max, guesses RPE, automatically changes a training day, advances the mesocycle or approves a decision.
- New users without a selected beginner route and established athletes do not see the card.

## QA
Unit cases cover drafted/completed/upcoming/unresolved states, temporal cutoff, evidence limits, expiry and immutable history. Browser tests exercise the first workout, real Save, unknown RPE, schedule handoff and no-panel cases. Complete the existing Node/security, Chromium, iPhone WebKit, Android and iOS checks plus device/offline acceptance before merging.

Version **3.94.0**, unsigned native beta **35400**, schema **34** unchanged. Keep merged v3.93 as rollback.
