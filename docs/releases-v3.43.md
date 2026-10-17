# Loadnote v3.43 — Phase 3: useful Progress and offline Coach insights

This combines the proposed v3.41 Progress 2.0, v3.42 Coach Intelligence 2.0, and v3.43 Personalized Coaching Insights milestones. Based on the merged v3.40 release.

## v3.41 — Progress 2.0
- Compact last-28-day view of completed logged workouts, strength sets, and actual RPE recording coverage. Previous-period workout count adds context.
- Reuse ProgressStory for lift trend, adherence, milestones and the accepted Decisions timeline; no new progress score or inference from program percentages.
- Strength trends exclude explicitly skipped, warm-up and unfinished sets across the progress modules. Unrecorded RPE remains unknown; empty windows are not displayed as zero strength.
- Mobile layout collapses from three to two columns, preserving readable labels and touch controls.

## v3.42 — Offline Coach Intelligence 2.0
- A stalled/plateau question about a named competition lift uses the exact RPE-aware ProgressStory comparison, with a 12-week window comparing early versus recent four weeks.
- Requires an unambiguous mapped competition exercise and two RPE-aware evidence days per comparison window; ambiguous or sparse cases explain what is missing.
- Describes whether recent estimates are similar, higher or lower and explains why that **does not diagnose a plateau or its cause**.
- Converts stored kg only for display; responds offline without calling a model or changing planned sessions. Retains conversation history for pronoun follow-ups only when a lift has been named.

## v3.43 — Personalized weekly observations
- Surfaces up to four grounded observations from an already-validated single-program weekly review: incomparable/missing evidence, RPE above targets, matched work, and the existing approved review route.
- Offline Coach can answer "What stood out this week?" using that exact weekly evidence; no duplicate decision logic or automatic calendar edits.
- Missing/revised sessions do not imply fatigue, nonadherence or strength loss. All proposed adaptations continue to require Decisions review and explicit approval.

## Compatibility and validation
- No storage schema change or migration. Existing completed workout history, program presets, adaptations and local drafts remain intact.
- New Node and browser regressions validate sparse/no-RPE evidence, future exclusion, kg/lb display, incomplete set filtering, offline routing and non-mutation of stored history.
- Release gate: all automated CI checks, browser shards, WebKit and native compilation must pass before merging. Real-device/athlete use is still needed to evaluate coaching utility.
