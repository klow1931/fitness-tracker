# Athlete Model & Decision Readiness (schema 14)

v1.13 extends the evidence boundary immediately before the v2 Training Decision Engine. It describes what Loadnote knows, what was planned, what was completed, when it knew it and why evidence may be limited. `decisionAllowed` remains `false`; this release does not prescribe load changes, deloads, progression or meet preparation.

## Confirmed exercise roles

`exerciseRoles` is an independent revisioned collection. Each record maps one stable exercise identity to a role: competition lift, close variation, supplemental movement, assistance movement, isolation/rehabilitation or conditioning. Competition lifts and close variations also identify squat, bench or deadlift as their relationship.

Built-in name matching can suggest obvious mappings, including Back Squat, Bench Press, Deadlift and common close variations. Suggestions only populate the form. They have no analytical effect until the athlete reviews and saves them. Original workout labels and loads remain unchanged.

Mappings retain ordered complete revisions with `recordedAt` timestamps. Historical as-recorded analysis only sees mappings recorded by its knowledge cutoff. Current-corrected analysis intentionally uses today's confirmed mappings for retrospective interpretation.

## Evidence snapshot

`LoadnoteReadiness.snapshot(state, {asOf, knownAt?, retrospective?})` requires an ISO calendar date and returns a deterministic snapshot for squat, bench and deadlift. The analysis window begins at the active block start, or 84 days before the analysis date when no block is active.

Each lift keeps these values separate:

| Evidence | Meaning |
| --- | --- |
| Logged working load | Weight actually recorded in the latest matching session |
| Baseline capacity | Earliest RPE-aware demonstrated-performance estimate in the analysis window |
| Latest capacity | Most recent RPE-aware demonstrated-performance estimate in the analysis window |
| Observed hard-set rate | Logged competition-lift sets at RPE 7 or higher per analysis week |
| Block training max | Deliberate programming input from the active block |
| Known 1RM | Athlete-reported or tested block benchmark |
| Profile benchmark | Older athlete-profile field retained for existing program-generator compatibility |

No precedence rule turns these into one max. A close variation contributes matching-session context only after confirmation and never becomes the competition lift's known 1RM or training max by inference.

The observed hard-set rate describes only sets present in the log. It is not prescribed volume and does not imply that a planned workload was completed.

Readiness is reported as Ready, Limited or Not ready for each lift, never as a single opaque score. Reasons include missing competition-lift mapping, fewer than three sessions, low usable-RPE coverage, absent block context, incomplete block history and incomplete point-in-time provenance.

## Point-in-time modes

Current-corrected mode excludes workouts after `asOf` but uses today's corrected block context and confirmed role mappings. This is appropriate when historical context was entered after the training occurred.

Historical as-recorded mode limits block and mapping revisions to the end of `asOf`, or an earlier explicit `knownAt`. For workout edits, deletions and undos recorded after the cutoff, it reverses those revisions to reconstruct the earlier value. New workouts saved in schema 13 carry `createdAt`/`updatedAt` and a creation revision.

Older workouts do not have reliable saved-at timestamps. They remain visible by workout date so useful historical training is not discarded, but strict replay reports the limitation instead of claiming complete provenance.

## Returning-powerlifter acceptance case

For a conservative return/re-entry block, increasing logged training loads must remain separate from estimated capacity. A 365 lb programming training max, a known 446 lb squat and an RPE-aware performance estimate are three different facts. The snapshot explicitly warns that planned load increases in a conservative return ramp are not equivalent to strength gains.

## v1.16 capacity evidence

Capacity evidence excludes singles below RPE 10 without changing legacy estimated1RM or saved PRs. Logged hard sets and RPE coverage retain those singles; estimate eligibility is separate. Fewer than three distinct capacity-evidence days explicitly limits readiness, even if three workout dates exist. Low effort is not missing RPE. Review and block analytics use the same `Core.capacityEvidence` contract.
