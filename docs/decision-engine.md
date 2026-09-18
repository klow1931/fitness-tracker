# v2 Decision Engine

The v2 decision engine is a deterministic, read-only decision layer built on Loadnote's existing athlete evidence and Decision Readiness contracts.

## Initial contract

For each confirmed competition lift, the engine returns one of four outcomes:

- `increase`
- `hold`
- `reduce`
- `insufficient-evidence`

A directional decision is allowed only when the existing Decision Readiness snapshot is `ready`. The engine currently requires at least three usable capacity-evidence days and never turns submaximal singles into RPE-adjusted capacity estimates.

The rules use recent demonstrated-capacity direction, exposure-to-exposure consistency, RPE direction, evidence freshness, and training-block context. Decision evidence is bounded to the same active-block or rolling analysis window used by Decision Readiness so older history cannot silently enter a current recommendation.

A directional recommendation is withheld when the latest usable competition-lift evidence is more than 28 days old. This is an evidence-freshness guard, not an injury or detraining claim.

An `increase` requires an overall positive capacity trend, controlled effort, and no meaningful decline across either of the two recent exposure-to-exposure intervals. A positive first-to-last endpoint with a contradictory middle exposure is held instead of being treated as a clean upward trend. A sharp first-to-latest RPE increase also blocks an increase even when loads or estimated capacity rose.

A `reduce` requires both a meaningful overall capacity decline and high latest effort, with both recent intervals non-increasing within a small noise tolerance. Mixed patterns are held rather than escalated into a reduction.

Conservative return/re-entry context remains a guard against interpreting planned load increases as equivalent strength gains or accelerating progression from stable evidence alone.

## Boundaries

- Read-only: no workout, program, training max, schedule, or stored athlete data is changed.
- Deterministic: identical evidence produces identical decisions.
- Auditable: the latest three capacity-evidence rows and plain-language signals are returned with each decision.
- Action-oriented but prescription-safe: each decision also returns `nextExposure` and `watchNext` guidance without selecting an exact load or rewriting the program.
- Chronology-aware: an explicit analysis date is required; future workouts are excluded. As-recorded mode continues to use the existing revision/knowledge-cutoff replay.
- No fake confidence percentage. Calibration belongs after walk-forward testing.
- This is training guidance, not a medical readiness or injury-risk model.

## Next v2 work

1. Add walk-forward backtesting that evaluates historical decisions against subsequent observed performance without future-data leakage.
2. Define outcome/error metrics before adding confidence calibration.
3. Validate the rules against real athlete exports without committing personal training data to the repository.
4. Use walk-forward results to decide whether any numeric load recommendation or confidence calibration is justified.
