# Loadnote v3.93.0 — Beginner Program Builder

## Purpose
After v3.92 made the first workout easy to log, v3.93 helps a beginner who does not know *what to train*. The first-run **Help me create a plan** choice now opens a concise three-question starter builder: training goal (strength, muscle growth or routine), available weekdays (2–3), and equipment (full gym, dumbbells or bodyweight).

## Scope and safeguards
- A four-week, two- or three-day *editable starting structure*, with distinct exercise slots per training day. Sets and reps are visible and editable before review. Weekdates use the next/current Monday.
- Uses **LoadnoteCustomProgram.build/save/schedule**, not a duplicate plan persistence engine. Starting loads, 1RMs, training maxes and RPE are not guessed; progression is not automatically applied.
- Preview is read-only. Changing any input invalidates the review. **Save reviewed plan** requires athlete confirmation, and **Add plan to Calendar** remains a separate action with conflict checks. Neither records a completed workout.
- Exercise suggestions are generic and may need substitution; the existing catalog is offered for editing. Unknown names and missing loads are surfaced by the existing builder.
- Advanced programming profile, Decisions, powerlifting, and Custom Program Studio remain accessible. Historical workouts, units and program approvals are unchanged.

## Quality gate
Node tests for all goal/equipment/day combinations, review/save/schedule boundaries, unknown loads and RPE, unchanged history and invalid inputs. Browser tests for first-run choices, draft invalidation, explicit save, failed storage, no automatic scheduling, responsive form and the existing advanced routes. Complete static, Node, security, Chromium, iPhone WebKit and unsigned native checks before merge.

**v3.93.0**, unsigned beta **35300**, schema **34** unchanged. v3.92.0 stays the rollback.

## v3.93 CI follow-up
Restored the legacy guided-profile onboarding test's explicit post-save navigation callback; the separate starter-plan path remains its own three-question dialog. The starter save confirmation now says **not scheduled** until the athlete separately approves Calendar scheduling. The validation test unchecks saved training days by stable checkbox value so a changing checked selector cannot target a different element. No change to saved workouts, training targets, or scheduling permissions.
