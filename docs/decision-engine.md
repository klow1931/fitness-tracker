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

1. Validate v2.3/v2.4 behavior against real athlete exports without committing personal data to the repository.
2. Analyze athlete response versus observed next-exposure outcomes without assuming the athlete or engine was inherently correct.
3. Review threshold sensitivity alongside live Accept / Modify / Ignore patterns before changing the default policy.
4. Use historical and live feedback together before considering numeric confidence or exact load recommendations.


## v2.3 Backtesting contract

v2.3 adds a read-only walk-forward backtest layer. Historical decisions are generated using only information available at each cutoff, then evaluated against the next usable competition-lift exposure that occurs after the decision.

The backtest does **not** treat the athlete's historical programming choice as the ground-truth correct answer. Instead, it measures observable outcomes after each historical decision point.

Reported metrics include:
- decision counts by Increase / Hold / Reduce / Insufficient evidence
- abstention rate
- outcome coverage
- mean next-exposure capacity change by decision type
- Increase decisions followed by stable-or-improved capacity
- Reduce decisions followed by stabilization or rebound
- warning misses, defined as Increase/Hold decisions followed by a large capacity decline with high effort

Policy thresholds are now explicit and can be replayed side-by-side through sensitivity analysis. This is intended for validation and calibration, not automatic optimization.

As-recorded mode is the default for backtesting. Current-corrected replay remains available for diagnosis, but it should not be confused with what the engine actually could have known at the historical cutoff.


## v2.4 Athlete feedback contract

Live Decision Center recommendations can now record one athlete response per exact decision snapshot:

- `accept`: the athlete intends to follow the displayed recommendation.
- `modify`: the athlete chooses Increase, Hold, or Reduce instead, with an optional note.
- `ignore`: the athlete intentionally does not use the recommendation.

The event stores the decision snapshot shown at the time of response rather than recomputing it later. This includes the engine version, analysis date, decision, rationale, next-exposure guidance, watch-next guidance and recent evidence rows.

Feedback is only recordable for today's current-corrected decision. Historical replay is read-only to avoid hindsight contamination.

Outcome linkage is identity-based: the saved evidence exercise IDs are used to find the next usable competition-lift exposure after the decision. A later exercise-name match alone cannot rewrite the outcome relationship.

v2.4 does not learn from this data yet. The event history is evidence for a later feedback/outcome analysis layer; thresholds and programs remain unchanged.


## v2.5 Outcome attribution and feedback analysis

The athlete-feedback report is observational. It summarizes response counts, intended directions, unique observed next-exposure outcomes, and capacity/RPE associations by response and lift. An athlete's intended action is not independently verified as their executed programming. The report does not compare counterfactual outcomes.

A saved event is assessed against the first subsequent usable competition-lift workout within 42 days using stable exercise IDs from the original evidence snapshot. Where multiple events point to the same lift/date/workout, the most recent analysis date takes attribution (created-at breaks ties). Earlier events remain in history but are marked overlapping and excluded from the independent observed count. No one workout is counted repeatedly as several successes. Unobserved events are separated into awaiting outcome and ended window as of the reporting date; future-dated events/workouts are excluded.

Data-coverage descriptions: 0–2 uniquely attributed follow-ups = Collecting feedback; 3–9 = Early pattern; 10+ = Reviewable history. These are descriptive sample-size bands, not probabilistic confidence scores or validation of causal efficacy.

Outcome categories are improved (capacity change ≥1%), declined (≤−1%), or stable (between those thresholds). Lift and response strata show their sample sizes and do not display numeric means when there are no observations.
