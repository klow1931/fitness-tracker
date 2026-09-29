# Program quality gate (v2.67)

## Purpose

v2.67 adds a deterministic whole-cycle quality review before a meet-preparation cycle is approved.

The gate is not a program score and does not claim to identify an optimal dose. It checks whether the generated cycle is structurally coherent enough to hand to the athlete for review.

The gate runs after the full meet cycle has been generated and before the original cycle is saved.

## Statuses

A cycle receives one of three statuses:

- **Pass** — no structural quality finding requires review.
- **Review** — one or more bounded findings should be inspected by the athlete. A review finding does not mean the program is wrong.
- **Blocking** — an internal structural inconsistency must be resolved before the cycle can be approved.

Blocking findings disable cycle approval and are also enforced in the save path.

## What the gate checks

### Calendar and event alignment

The gate verifies:

- selected cycle length equals the generated weekly outline
- accumulation, strength, peak, taper and event-week counts match the reviewed configuration
- the final week is the correct mock-meet or competition-meet week
- event week contains no inferred training session
- no generated workout lands on or after the event date
- every generated workout remains inside its declared week

Meet attempts remain separate athlete-entered event data.

### Session feasibility

Every generated workout is checked against the athlete-reviewed session time budget.

- A session above the budget is blocking.
- A session using at least 90% of the budget is a review item.

The existing time estimate remains deliberately simple: preparation time, working-set time and exercise-transition time. It is not a physiological recovery estimate.

### Load and RPE bounds

Every generated set must have:

- a positive load relative to its own explicit training max
- no more than the supported 85% training-max ceiling
- a valid 1–10 RPE cap

All checks use internal kilograms and each exercise's explicit training max. Displaying lb does not change the result.

### Week-to-week continuity

Inside the same phase, the gate reviews unexpected jumps in:

- lift exposure frequency
- working-set count

At phase boundaries it checks for:

- simultaneous large set and loading increases
- unusually large accumulation → strength loading jumps
- volume increases entering the peak
- reduced competition specificity entering the peak

These findings do not automatically edit the program.

### Competition specificity

Peak and taper weeks must use the reviewed competition lift for squat, bench and deadlift.

A variation appearing in peaking/taper or a missing competition-lift exposure is blocking.

The weekly preview reports competition-specific set percentage so the athlete can see how specificity changes across the cycle.

### Peak and taper continuity

The first taper week is compared with the final peak week.

The gate reviews a taper that fails to reduce:

- working sets
- average planned percentage of training max

A two-week taper that simply repeats the same bounded prescription is surfaced for review rather than silently presented as individualized tapering.

### Hard squat/deadlift spacing

Primary competition squat and deadlift exposures planned at at least 75% of training max or RPE 8 are treated as hard exposures for scheduling review.

If those exposures occur on the same or adjacent day, the gate surfaces the pattern for manual review.

This is a scheduling heuristic, not a recovery diagnosis.

### Extended phases

The underlying phase engine supports six progressive weeks at a time. Longer meet cycles intentionally hold the final supported accumulation or strength prescription rather than extrapolating intensity indefinitely.

v2.67 surfaces those repeated weeks as review items so a 16–20+ week cycle cannot look more individualized than the generator actually is.

## Whole-cycle preview

The meet-cycle preview now includes:

- quality-gate status and findings
- total proposed workout count
- estimated session-time range and reviewed budget
- weekly max session time
- lift exposure frequency
- working-set count
- average planned percentage of that exercise's training max
- competition-specific set percentage

The existing detailed session/set preview remains available below the weekly summary.

## Persistence

Newly reviewed meet cycles save the full quality-gate snapshot and add `programQualityGate: program-quality-gate-v1` to the decision environment.

The snapshot contains a deterministic fingerprint of:

- reviewed cycle configuration
- source-program identity/configuration
- generated sessions
- generated weekly outline

Validation confirms that the saved gate still belongs to the saved original cycle. The v2.66 Cycle Journal also surfaces the saved gate status, and its decision-data audit checks the gate fingerprint, status/count consistency and decision-environment policy identity.

Older meet cycles without a quality-gate snapshot remain valid and are identified as legacy observability records rather than treated as corrupt training data.

## Simulation coverage

v2.67 adds deterministic full-cycle simulations covering:

- 8, 12, 16 and 20 weeks
- 3-day and 5-day schedules
- intermediate and advanced programming profiles
- sparse training history
- kg and lb display settings
- mock meets and named competition meets

These simulations are structural tests. They do not establish that one training plan is optimal for all athletes.

## Non-goals

v2.67 does not:

- alter the v2.65 adaptive thresholds
- automatically fix or rewrite a generated cycle
- infer a training max
- infer meet attempts
- diagnose fatigue, readiness or recovery
- assign a numerical program score
- use display units as internal loading units
- change completed workouts or approved Calendar history

Schema v25 remains unchanged.
