# Loadnote v3.97.0 — Beginner Review Fixes and Plan Handoff

## Fixes
- A completed strength set requires an explicit load before Review. Blank is unknown; enter 0 for bodyweight / no added load. Existing saved records are not reinterpreted or migrated.
- Repeated and copied cardio sessions leave the new actual average heart rate blank. Repetition does not turn a previous reading into a new target. Editing an existing reading preserves it.
- Compound availability requests with an unsupported duration ask for clarification instead of silently proposing only weekdays. Daily workouts remain a separate route for shorter sessions.

## Beginner experience
- Home offers a saved starter-plan review instead of a blank logger when an unscheduled starter plan exists. Choose the exact saved plan and workout, load an editable unscheduled draft, or confirm Calendar scheduling separately. Existing drafts and scheduled sessions take precedence.
- Dumbbell-only defaults require no bench; bodyweight defaults require no step or elevated support. Review exercise suitability and any substitutions yourself.
- The starter builder separates setup, review, and post-save scheduling. Exercise editing and dates are expandable. Repeated row-level warnings are replaced with a plain explanation of library names, unspecified loads, and optional effort ratings.
- Offline Coach answers common getting-started and starting-weight questions, opens first-plan tools, finds saved starter plans, and explains RPE with repetitions-left examples. It never guesses a starting weight or records a workout from chat.
- New beginner tests are explicitly included in the iPhone WebKit gate.

Version 3.97.0, unsigned development build 35700, schema 34 unchanged. No historical data migration. This release does not claim physical-device or formal accessibility acceptance.
