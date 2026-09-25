# Phase reviews — v2.16

Decisions → Programs → Phase review adds an explicit review to a completed v2.14 phase. It is a conservative, versioned rule (`phase-effort-v2`, retaining validation of accepted `phase-effort-v1` history), not validated personalized coaching. No background adaptation occurs.

## Evidence and limits

- Select a scheduled phase program, completed phase and current recovery context.
- The complete phase must have ended. Each lift needs at least three exposures and complete matched sets, known creation timestamps, a captured before-training plan, unchanged reps/load, and RPE 6–10. Missing, changed, skipped, ambiguous, rescheduled, late-captured or low-RPE evidence withholds adjustments. Unknown recovery or discomfort also withholds them.
- Stable exercise IDs and explicit competition/variation mappings are used, not lift-name guesses. A changed programming profile or mapping requires manual review.
- Completion is linked workouts / originally expected sessions, not an invented adherence measure. Original planned sets, actual sets, recorded tonnage and average recorded RPE are shown separately. Partial logs are not interpreted as physiological capacity.
- Competition-only capacity endpoints reuse `Core.capacityEvidence`. They require at least three dates spanning 14 days. Variation estimates are not mixed into them. These are best eligible daily estimates, not measured maxes or proven gains. No percentage gain or confidence score is generated.

## Available proposals

Only accumulation → strength is currently adjustable. All changes are optional. A supported increase is an adjustment to an already reviewed future prescription, not a rewrite of training maxes or proof of strength gains. Strength → deload and the end of the sequence are review-only.

1. **Keep:** retain the existing plan, including its already-planned progression. This is not clearance to increase or evidence that progression was earned.
2. **Reduce load:** when at least two fully matched exposures exceed caps by at least 1 RPE, offer 5% off next-phase working loads, rounded down to the program's kg increment. Apply per lift, including its explicit variation exposures. Training maxes, reps, sets and caps do not change.
3. **Reduce sets:** if all matched work stays within caps but sleep, fatigue or soreness is reported worse, offer removing the final set per exposure, preserving at least two working sets. This preserves the top set in top/back-off work. This is an optional recovery heuristic, not a diagnosed individual volume requirement. No simultaneous load/set reduction is offered for one lift.
4. **Progress:** when all fully matched exposures are at least 1 RPE below caps of 7+, and at or below caps of 6 (the minimum usable RPE here), recovery is reported usual, three or more competition-lift RPE-aware dates span at least 14 days, the final capacity endpoint is not more than 1% below the first, and the whole future phase fits the exercise-specific 85%-of-training-max ceiling, offer a 2.5% load increase rounded down to the existing kg increment. The increase must actually clear the increment; no automatic progression, no variation-to-competition inference, and no measured strength-gain claim.\n5. **Gather:** explain missing evidence or manual-review needs. Saving with Keep records the findings without editing the schedule.

All future exposures for a selected lift must still be eligible; partial-phase adjustment is rejected. Manually changed plans, moved dates, cancelled/skipped/missing sessions, completed workouts and today/past sessions are not overwritten. An open target draft blocks changes. Deloads stay intact. Phase extensions, meet peaks and automatically optimized volume are intentionally deferred. Progress is withheld on sparse, low-RPE, above-cap, incomplete or changed evidence, reported worse recovery, too-large increments and training-max ceiling conflicts.

## Chronology, persistence and audit

`analyze(state, {programId, phase, asOf, now, recovery})` uses the earlier of `now` and the end of `asOf`. Program scheduling, role/profile revisions, schedule revisions and workout edits are evaluated at that cutoff. Future workout outcomes do not appear in earlier reports. Unknown workout creation times are not decision evidence. Recovery is explicitly supplied for the review; backtest callers must use context actually known then, not a later check-in.

`preview(report, choices)` is pure. `apply` re-analyzes to reject stale evidence, checks current completed workouts and draft locks, and appends Calendar revisions. It never rewrites workouts or the original phase program. One accepted review per phase prevents repeated reductions. The UI persists the candidate before swapping live state; write failures leave state unchanged.

Schema 22 (unchanged in v2.16) adds `phaseReviews: []`. Legacy backups remain valid. JSON backups and recovery snapshots preserve accepted findings, evidence, choices, policy/increment/identity metadata and before/after Calendar revisions. Import validates identities, chronology and the exact permitted transformation. Saved reviews are audit records, not instructions to reapply changes.

## Validation

Node tests cover evidence, sparse guards, independent lift choices, RPE estimates, set/load reductions, stale reports, confirmation, draft locks, future outcomes and edit replay, schema migration, kg invariance and backup validation. Browser tests cover the review flow, unchanged originals, failed persistence, preview invalidation and offline reload on desktop/mobile Chromium. Physical iPhone and prospective coaching-quality checks remain separate.
