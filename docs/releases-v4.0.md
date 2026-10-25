# Loadnote v4.0.0 — Explainable Adaptive Training Loop

## Product milestone

Loadnote now connects the saved workout to a concise, evidence-grounded answer to: **What did Loadnote learn, and what happens next?** This builds on the existing v2.71 post-workout adaptive handoff, not on a new progression engine.

The normal loop stays: **Open today's workout → train → log actual work and optional RPE → save → view verified training evidence and the next review / approved prescription.**

## What was implemented

- The post-save adaptive handoff reuses `LoadnoteWorkoutFeedback.compare` to distinguish verified completed prescribed work, paired RPE above cap, missing RPE, changed work, missing plan, invalid plan, and unverified plan timing.
- A compact **What this workout tells Loadnote** section appears in the established post-workout recap, with specific supported set counts and one practical next step.
- The section is deliberately descriptive, never a fake confidence percentage or a one-session order to add weight. It does not diagnose fatigue, recovery, injury, or readiness.
- If the next prescription was already revised by an athlete-approved review, the new summary explains that the workout alone did not authorize that change. Existing accepted before/after changes and their rationale remain authoritative.
- Current weekly/phase gates, adaptations, exact Calendar revision identity, draft protection and athlete approval are unchanged. Only the existing lifecycle action may modify future programming.
- Workout-feedback script loading is moved ahead of the adaptive handoff to reuse its verified comparison at initial page load.

## Testable acceptance criteria

1. A saved workout with a valid pre-training prescription, matching logged work and known actual RPE shows the exact comparable set counts; within-target RPE does not authorize an automatic weight increase.
2. Valid paired RPE above target is displayed as an observation and refers to the ordinary reviewed progression gate, never an immediate reduction.
3. Missing actual RPE remains unknown; no target RPE is fabricated as a logged measurement.
4. Changed load/reps and different exercise work are explicitly not scored as full adherence.
5. A prescription captured after training, an invalid plan, or a workout without a prescription cannot be described as verified planned performance.
6. Existing approved weekly/phase changes and their before/after evidence are still displayed, and the next scheduled prescription stays the single source of truth.
7. Browsing the recap changes no workout/history, schedule revision, training max, or program decisions, including while offline.
8. No kg/lb conversion occurs in the evidence engine. Existing conversions remain in the UI and storage, with schema **34** unchanged.
9. Node, full Playwright Chromium, selected iPhone WebKit, mobile/native/beta checks pass before merging; real-device interaction remains a separate acceptance step.

## Release and rollback

**Version 4.0.0**, unsigned development build **36000**, schema **34**. No data migration, automatic schedule writes, or new user-data persistence. Rollback: merged v3.99.0 on `main` (base `eb86e7d`).

The change is a transparent evidence-and-decision handoff milestone, **not** autonomous continuous reprogramming after every set or workout. Production claims must respect the reviewed/approved adaptation boundary.
