# Loadnote v3.78.0 — Exact, athlete-approved training outcome explanations

## Why this milestone exists

The v3.75–v3.77 Coach can combine validated training evidence, retain bounded dialogue context and compare available reviewed options. v3.78 adds a narrow, personal retrospective: **what happened after an approved change to my squat, bench or deadlift?** The new Coach answer reuses the existing `LoadnoteAdaptiveOutcomeLearning` engine; it does not learn a new progression policy.

## What works

- A question such as **"What happened after my last squat adjustment?"** shows the latest athlete-approved adaptation for that lift, exact validated follow-up availability and, only if supported, the recorded change in RPE-aware estimated capacity.
- **"Do my past bench adjustments usually work?"** reports grouping by the exact lift and approved action. With fewer than three comparable follow-ups it says that a repeated personal pattern has **not** been established. The earlier pattern summarizer still owns grouping and comparison thresholds.
- When sessions or actual RPE are missing, revisions are mismatched, or linked follow-up was not completed by the requested date, the outcome stays **unobserved**, rather than being counted as an improvement or a failure.
- Ambiguous references ask which competition lift to inspect; imported/custom-program edit questions remain with the existing program-edit explanation workflow.
- The reply includes one short, expandable source-labeled evidence card. The app does not save a new decision, change Calendar prescriptions or infer medical recovery.

## Source and safety boundaries

The new `src/product/coach-outcome-review.js` reads `src/product/adaptive-outcome-learning.js` and formats bounded observations. The existing training engine controls exact workout linkage, date cutoffs, acceptance history, eligibility and the descriptive outcome classes. A change that precedes a later result is **not** proof that it caused the result. The Coach does not prescribe increases/decreases or turn observations into automatic policy updates.

All stored weights remain **kg**, and this milestone reports estimated-capacity **percent change** rather than mixing display-weight and stored-weight units. The data schema remains **34**. No migration or new persistent Coach memory is introduced.

## Release and rollback

Development version **3.78.0**; unsigned Android/iOS beta build **33800**. PWA cache, app footer, package metadata, native manifests, changelog and release notes must match. Keep merged v3.77 as known-good rollback until CI and hands-on validation.

## Acceptance

- `tests/coach-outcome-review.test.js`: synthetic source boundaries plus exact historical approved phase-review evidence, future cutoff, missing RPE, multiple lifts, custom-edit separation and state immutability.
- `tests/browser/coach-v378.spec.js`: mobile-width offline Coach, source-labeled expandable evidence and no writes.
- Existing `npm run check`, `npm test`, full Chromium regression suite, iPhone WebKit regression suite, native beta gates and Android/iOS compilation must pass.
- Automated checks do not prove physical-device reliability; test offline and Home Screen update safety on the actual device before broader rollout.
