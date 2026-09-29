# Evidence-backed starting prescription (v2.64)

## Purpose

Loadnote can now form a conservative **starting-structure suggestion** before an athlete reviews a new phase-based powerlifting program. The suggestion is evidence for review, not an optimized dose and not an automatic training decision.

The system looks only at information known at the review cutoff and keeps squat, bench and deadlift evidence separate.

## Evidence window

The starting suggestion uses the prior 28 days of auditable workout history for the currently confirmed competition lift and confirmed close variations.

For each lift it records:

- matching exposure dates
- competition-lift exposure dates
- valid logged sets
- 3–8 rep development sets
- RPE coverage and average logged RPE
- recent weekly exposure frequency
- recent weekly development-set count
- competition-lift RPE-aware estimated-capacity direction when enough dates exist
- repeated top-set/back-off session structure

Missing or sparse logs are not interpreted as low tolerance.

## Suggested structure

A suggestion can include:

- 1–3 lift exposures per week
- 2–4 working sets per exposure
- a 0.5 or 1.0 percentage-point weekly progression step
- recent available training weekdays
- straight or top/back-off format for the primary exposure

The bounds intentionally match the existing phase builder. Loadnote never infers a training max from this evidence.

Frequency is anchored to observed recent exposure frequency when at least three matching dates span 14 days. Working sets are anchored to recent 3–8 rep development-set counts. A weekly-set guardrail is used only when all four recent seven-day windows contain matching work; only then is the suggestion prevented from exceeding the four-week weekly development-set average by more than 25%. Missing weeks are not treated as evidence of low workload tolerance.

The weekly progression step defaults to 1 percentage point. It may be reduced to 0.5 when recent matching-set average RPE is high or the supported competition-lift estimated-capacity comparison is lower. **Low RPE alone never increases the progression step.**

A primary top/back-off format is suggested only after at least two recent competition-lift sessions show a heavy one- or two-rep set followed by lighter work of three or more reps.

## Athlete review

The phase builder shows the evidence and suggestion before program generation. When a complete 2–5 day structure is available, the athlete may explicitly choose **Use evidence suggestion**. Every field remains editable afterward.

Generating the phase preview creates a read-only comparison between the suggestion and the athlete-selected configuration. Differences in exposure frequency, weekly sets and progression step are surfaced as review prompts, not errors.

Newly reviewed phase programs freeze this comparison as `startingPrescriptionSnapshot`. Older phase programs without that additive field remain valid.

Scheduling rechecks current evidence for newly reviewed v2.64 programs so a materially changed pre-launch context requires a fresh review.

## Non-goals

v2.64 does not:

- infer or rewrite training maxes
- diagnose fatigue, readiness or recovery
- infer optimal volume
- automatically schedule or save a program
- increase progression because training felt easy
- change active-program weekly adaptation rules
- rewrite existing workouts, programs or Calendar history

v2.66 gives the starting-prescription engine the explicit policy identity `starting-prescription-v1` and records that identity in newly reviewed phase-program decision environments. The v2.64 recommendation rules above are unchanged.

Schema v25 is unchanged.
