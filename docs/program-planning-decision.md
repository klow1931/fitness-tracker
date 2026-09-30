# Decisions-driven program planning (v2.69)

## Purpose

v2.69 moves meet-prep timeline arithmetic and phase allocation out of the athlete-facing workflow and into a deterministic Decisions planning layer.

The athlete supplies facts and constraints:

- reviewed program start week
- mock meet or competition
- event date
- competition name when applicable
- availability, equipment, time limits and exercise identities through existing setup

Decisions calculates the supported prep structure. The athlete still reviews and approves the resulting program before anything is scheduled.

## Meet date is the timeline anchor

The event date and reviewed start week determine total prep length automatically.

For a Monday-based start week, the event belongs to the week containing that date. The athlete no longer enters a separate total-week value that can disagree with the event date.

Examples:

- start Monday 2026-10-12 + mock meet Saturday 2026-12-26 → 11 total program weeks
- start Monday + an event in week 12 → 12 total program weeks

Normal supported meet prep remains 7–52 weeks. A shorter date window is rejected explicitly rather than silently compressing accumulation, strength, peak, taper and event week into an unsupported structure.

## Automatic phase allocation

`program-planning-decision.js` owns `program-planning-decision-v1`.

The default calculation:

1. reserves the event week
2. reserves one taper week
3. uses one peak week only at the seven-week minimum; otherwise uses two peak weeks
4. divides remaining base weeks between accumulation and strength
5. applies the existing whole-program quality gate after the full cycle is generated

The accumulation/strength split reuses frozen evidence from the reviewed lift setup whenever possible.

Priority order:

1. frozen transition/block objective recommendation
2. frozen starting-prescription evidence plus reported recent consistency
3. bounded 55/45 accumulation-to-strength default

No future workout data is used to rewrite the frozen source evidence.

When the timeline creates more than six weeks in accumulation or strength, Decisions states that the extra weeks hold the last supported phase target. The v2.67 quality gate also surfaces the extended hold.

## Advanced override

Manual phase lengths remain available under **Customize phase lengths**.

The athlete may override:

- accumulation weeks
- strength weeks
- peak weeks
- taper weeks

The meet date still fixes total duration. Custom phase lengths must sum exactly to the date-derived timeline and preserve the existing structural minimums.

An override is stored as `athlete-customized`; it is never represented as a Decisions-generated allocation.

## Persistence and audit

New meet cycles freeze the planning decision alongside the original cycle.

The snapshot records:

- policy/version
- source-program identity
- review cutoff
- event input
- automatic versus athlete-customized mode
- evidence source used for phase emphasis
- calculated phase lengths
- explanation strings
- deterministic context and decision fingerprints

The cycle decision environment records `programPlanning: program-planning-decision-v1`.

The Cycle Journal shows whether the original structure was Decisions-calculated or athlete-customized. The v2.66 decision audit checks planning-decision fingerprint/config/policy lineage without recomputing or rewriting the historical result.

Older meet cycles without planning-decision metadata remain valid and are treated as legacy observability records.

## Boundaries

v2.69 does not:

- infer a meet date
- change available days, equipment or exercise identities
- infer training maxes
- change v2.65 adaptive thresholds
- automatically approve or schedule a plan
- diagnose recovery/readiness
- choose meet attempts
- claim that an automatic phase split is physiologically optimal

The planning decision is deterministic, reviewable and overridable. Schema v25 remains unchanged.
