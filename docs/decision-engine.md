# v2 Decision Engine

The v2 decision engine is a deterministic, read-only decision layer built on Loadnote's existing athlete evidence and Decision Readiness contracts.

## Initial contract

For each confirmed competition lift, the engine returns one of four outcomes:

- `increase`
- `hold`
- `reduce`
- `insufficient-evidence`

A directional decision is allowed only when the existing Decision Readiness snapshot is `ready`. The engine currently requires at least three usable capacity-evidence days and never turns submaximal singles into RPE-adjusted capacity estimates.

The initial rules use recent demonstrated-capacity direction, RPE, and training-block context. Conservative return/re-entry context acts as a guard against interpreting planned load increases as equivalent strength gains or accelerating progression from stable evidence alone.

## Boundaries

- Read-only: no workout, program, training max, schedule, or stored athlete data is changed.
- Deterministic: identical evidence produces identical decisions.
- Auditable: the latest three capacity-evidence rows and plain-language signals are returned with each decision.
- Chronology-aware: an explicit analysis date is required; future workouts are excluded. As-recorded mode continues to use the existing revision/knowledge-cutoff replay.
- No fake confidence percentage. Calibration belongs after walk-forward testing.
- This is training guidance, not a medical readiness or injury-risk model.

## Next v2 work

1. Add a read-only Next Decision UI.
2. Add walk-forward backtesting that evaluates historical decisions against subsequent observed performance without future-data leakage.
3. Define outcome/error metrics before adding confidence calibration.
4. Validate the rules against real athlete exports without committing personal training data to the repository.
