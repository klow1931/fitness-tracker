# Phase-specific cycle decisions (v2.65)

## Purpose

Loadnote's meet-cycle reviews now use an explicit phase policy instead of applying one generic adjustment mindset to accumulation, strength, peaking and taper.

The policy remains deterministic, bounded and athlete-approved. It does not diagnose fatigue or recovery, does not select meet attempts, and does not rewrite completed training.

## Accumulation

Primary objective: **protect repeatable workload**.

Available review actions inside accumulation:

- keep the reviewed plan
- remove one set from each eligible next-week exposure
- reduce matching next-week load by one reviewed program increment
- increase the confirmed competition lift by one reviewed program increment only when the higher accumulation-specific evidence bar is met

Accumulation upward progression requires:

- all planned competition-lift sets completed
- at least 6 directly comparable competition-lift sets
- zero comparable competition-lift sets above cap
- at least 3 competition-lift sets at least 0.5 RPE below cap
- an improving within-phase estimated-capacity comparison of at least +2%

Easy RPE alone never creates an increase.

At the **accumulation → strength** transition, upward progression is disabled because the reviewed program already contains a planned intensity transition. Supported downward corrections may still be reviewed.

## Strength

Primary objective: **protect competition-specific loading**.

Inside strength, the existing guarded one-increment increase remains available when:

- all planned competition-lift work is completed
- at least 4 competition-lift sets are directly comparable
- none exceed cap
- at least 2 finish at least 0.5 RPE below cap
- within-phase estimated capacity improves by at least +1%

Repeated above-cap effort can support one fewer set. Above-cap effort plus a lower within-phase capacity comparison can support one load increment lower.

At the **strength → peaking** transition, Loadnote never adds load or changes set count. A one-increment downward load review is available only from directly comparable competition-lift evidence; the controller recommends it only when repeated above-cap competition work is paired with a lower strength-phase capacity comparison.

## Peaking

Primary objective: **preserve specificity without escalating stress**.

Inside peaking:

- keep is always available
- no upward load progression is available
- no set-count adjustment is available
- one load increment lower can be reviewed when at least 2 directly comparable competition-lift peak sets exceed their approved RPE caps

A multi-week capacity trend is not required for that bounded peak correction because a short peak may not contain enough dates to create one. The evidence must come from the competition lift itself.

Learned action-history patterns from general training phases do not steer peak corrections.

## Taper

Primary objective: **preserve the reviewed taper**.

Taper prescriptions are not adaptively escalated or replaced. Keep is the only cycle-review action during taper and into event week. Sparse taper evidence is not treated as a new training dose.

## Event week

Mock-meet and competition-meet weeks remain event records, not adaptive workout prescriptions. Results are entered separately and never inferred from training estimates.

## Persistence and compatibility

v2.65 stores the resolved phase policy inside each new weekly-review report. Weekly-review record version 4 uses policy `cycle-week-adjust-v4`. Earlier v1–v3 weekly reviews remain valid.

The adaptive controller reports policy `cycle-adaptive-v5` and includes the active phase-policy snapshot in its explanation. All calendar edits remain future-only, bounded to the next week, and require explicit athlete approval.

Schema v25 is unchanged.
