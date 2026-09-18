# v2.3 Decision Backtesting

Loadnote v2.3 adds a read-only walk-forward evaluation layer for the deterministic Decision Engine.

## What a backtest asks

A historical decision is generated using only the information allowed at its cutoff date. The default mode is **as-recorded**, which uses the role mappings, block context, workout creation times and revisions that were known by that date.

The backtest then evaluates the decision against the **next usable competition-lift capacity exposure after the cutoff**. That future exposure is an outcome observation, not input to the historical decision.

Historical athlete programming is not treated as a ground-truth answer. The report measures what happened after a recommendation rather than grading whether the historical athlete/coach chose the same action.

## Cutoff modes

`exposure-dates` is the default. Each competition lift is replayed at its own usable evidence dates. This is useful for evaluating Increase / Hold / Reduce behavior immediately after new evidence enters the model.

`explicit` cutoffs can also be supplied. This supports weekly or other fixed-cadence replay and is necessary for evaluating time-dependent guards such as stale evidence after a training gap.

## Per-decision rows

Each row includes:

- lift and historical cutoff date
- Decision Engine outcome
- whether a directional decision was allowed
- reason, Next exposure and Watch next guidance
- the evidence rows visible to the decision
- the next usable outcome exposure, when one occurs inside the outcome horizon
- days until that exposure
- capacity change versus the decision's latest evidence
- RPE change
- neutral outcome class: improved / stable / declined / unobserved

## Aggregate metrics

The summary reports:

- decision counts
- directional-decision count
- abstention rate
- outcome coverage
- mean next-exposure capacity change grouped by decision
- Increase followed by stable-or-improved capacity
- Reduce followed by stable-or-rebounded capacity
- warning misses: Increase/Hold followed by at least a 3% capacity decline at RPE 8.5 or higher

These are descriptive validation metrics. They are not a confidence score and do not establish causal effects.

## Threshold sensitivity

Decision thresholds are now exposed through the Decision Engine's immutable default policy and optional policy overrides. `LoadnoteDecisionBacktest.sensitivity()` runs named policy variants side-by-side without changing stored athlete data or the default engine behavior.

Current default thresholds remain:

- evidence freshness: 28 days
- exposure-direction noise tolerance: 0.5%
- sharp RPE-rise guard: +1.5
- Reduce capacity threshold: -3%
- Increase capacity threshold: +1%
- conservative-block acceleration threshold: +2%
- high-effort guard: RPE 9
- Reduce effort threshold: RPE 8.5
- Increase maximum recent/latest effort: RPE 8.5

These values remain heuristics. v2.3 makes them testable; it does not claim they are scientifically calibrated.

## Boundaries

- Backtesting is read-only.
- No workout, schedule, program, training max, block or athlete record is modified.
- Future outcome data cannot change the historical decision row.
- Outcome evaluation does not claim that a recommendation caused the later result.
- Missing future evidence remains unobserved rather than being counted as success or failure.
- No confidence percentage is generated.
