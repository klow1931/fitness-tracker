# Cycle observability and reproducibility (v2.66)

## Purpose

v2.66 makes a Loadnote-directed powerlifting cycle reconstructable without creating a second training database or changing the v2.65 progression rules.

The observability layer answers four separate questions:

1. **What did Loadnote know?** Point-in-time review evidence and the exact knowledge cutoff remain frozen.
2. **What did Loadnote recommend?** The displayed deterministic cycle-controller result is stored before athlete approval.
3. **What did the athlete choose?** The accepted lift-by-lift review choice remains separate from the controller recommendation.
4. **What happened afterward?** Later linked competition-lift evidence can be shown observationally without claiming that the decision caused the outcome.

## Decision environment

Newly reviewed phase programs and meet cycles carry an additive `decisionEnvironment` containing:

- Loadnote release version
- data-schema version
- capture time
- record purpose
- explicit policy identities used by that decision surface

Existing records without this metadata remain valid and are treated as legacy records.

The environment is descriptive metadata. It does not select loads, change a training max, or authorize an adaptation.

## Frozen weekly controller snapshot

A normal v2.66 meet-cycle weekly review stores the deterministic controller result that was displayed to the athlete. The snapshot includes:

- cycle, week, phase and review date
- exact review knowledge cutoff
- release/schema/policy environment
- fingerprint of the saved review evidence
- only the current-phase response evidence consumed by the controller
- only the relevant learned-history patterns consumed by the controller
- full deterministic controller recommendation
- fingerprints of frozen inputs and recommendation

The saved athlete choice remains a different field. An athlete can follow or override the displayed recommendation without rewriting what Loadnote originally recommended.

Weekly review record version 5 adds `controllerSnapshot`. The actual training policy remains `cycle-week-adjust-v4`; v2.66 does not introduce a new progression rule. Earlier review versions remain valid.

## Replay

`cycle-observability.js` can replay a saved controller snapshot against its frozen review and inputs. The replay compares the resulting canonical fingerprint with the saved recommendation fingerprint.

A matching replay means the deterministic controller code currently in use produces the same result from those frozen inputs. A mismatch is surfaced rather than silently rewriting the historical recommendation.

This is an audit tool, not a mechanism for retroactively changing training.

## Cycle journal

Coach → Programming includes a read-only Cycle Journal assembled from authoritative records already owned elsewhere:

- source phase program and starting-prescription snapshot
- reviewed meet cycle
- weekly reviews
- frozen controller recommendations
- athlete choices
- actual Calendar revisions created by approved reviews
- later linked competition-lift workouts
- athlete-entered mock/competition results
- immutable transition baseline

The journal is derived. It does not maintain a parallel event collection.

For each weekly lift decision, the journal distinguishes:

- displayed recommendation
- athlete-approved choice
- recommendation matched vs athlete override
- Calendar effect
- later outcome state

Later outcome states distinguish **awaiting**, **unobserved**, **revised/deviated**, and **observed**. A measured 0% change or stable estimate is never used as a substitute for unknown evidence.

Outcome linkage requires an auditable workout creation time, the exact scheduled-session identity, an existing captured Calendar revision, matching date, and matching prescription snapshot. For an adjusted lift, the workout must link to the exact review-created Calendar revision. For a kept lift in a session changed for another lift, its exercise-specific prescription must remain unchanged.

## Transition handoff

When a meet cycle is closed, its immutable transition baseline now carries the frozen controller snapshot for each v2.66 weekly review. This allows later next-block analysis to preserve what the prior cycle actually knew and recommended instead of relying on a later recomputation.

## Decision-data audit

The observability audit checks:

- malformed program/cycle decision environments
- missing controller snapshots on v2.66 weekly reviews
- controller snapshots that do not match their saved review
- altered input/recommendation fingerprints
- policy/cycle identity mismatches
- controller snapshots generated after the accepted review
- a saved 0% capacity value when the frozen response input was actually unknown

Legacy records without observability metadata are warnings, not evidence that the historical training record is incorrect.

During the v2.66 audit, two null-handling defects were corrected:

1. Next-block objective logic could convert a missing transition capacity change into numeric 0, making an unknown response look flat.
2. The same logic could convert a missing recent average RPE into 0, which could make a positive capacity comparison look like clearly manageable effort.

Both now preserve missing values as `null`. Starting-prescription numeric normalization was also hardened so null/empty values remain unknown rather than becoming numeric zero.

## Non-goals

v2.66 does not:

- add a new load/volume progression rule
- automatically approve a recommendation
- change exercise selection or training frequency
- diagnose fatigue, readiness or recovery
- infer meet attempts
- rewrite completed workouts or the original cycle
- claim that a later outcome was caused by a recommendation or athlete choice
- create a generic duplicate event log

Schema v25 remains unchanged.
