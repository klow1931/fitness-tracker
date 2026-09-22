# v2.7 — Decision use and weekly review

These features are read-only projections over existing readiness, decision feedback, workout and plan records. Schema remains 16. No new event collection or migration; existing backups remain compatible. Live direction thresholds and historical evidence guards are unchanged.

## Evidence checklist

Expanded withheld-lift cards show structured tasks from readiness: one confirmed competition mapping, active block and honest completeness, usable capacity days, RPE coverage, plan coverage, unexplained modifications, block conflicts and the engine's remaining freshness/replay limitation. Tasks link to existing forms without saving anything. Historical/as-recorded views show instructions without editing shortcuts. Do not fabricate old RPE or plans, declare incomplete history complete, or increase effort to unlock a recommendation.

## Weekly definitions

`LoadnoteDecisionUseReview.weekly(state,{asOf})` reports Monday through the selected date. Responses recorded this week use createdAt; uniquely attributed follow-ups observed this week use outcome workout date. A response can appear in both groups, or its follow-up can occur in a later week. Group counts are not additive. Awaiting count refers only to this week's responses. Attribution reuses Decision Performance, including overlapping/late-response exclusions. Future-edited feedback is withheld because earlier response revisions are unavailable.

Workouts are reconstructed through the report date using retained revisions. Legacy timestamps, pruned revisions and aliases still limit exact reconstruction. Saved baseline/follow-up sets may reflect corrections known by the report date; they are not claimed to be immutable decision-time sets.

## Follow-up comparison

Intended direction comes only from the saved response (Ignore supplies no direction). Planned and completed directions are independent comparisons between the baseline workout identified in the saved evidence and the uniquely attributed next usable capacity exposure, for the same exercise ID.

Compare flattened ordered sets only when counts and integer rep counts match and all loads are positive finite kg values. A 0.02 kg tolerance handles display rounding. Uniformly higher/lower (allowing unchanged sets) means Increase/Reduce; all unchanged means Hold. Mixed directions, missing data and changed set/rep structures remain Not comparable. RPE and capacity outcomes are displayed separately. No total-volume shortcut, variation substitution or physiological strength inference is used.

Plan direction additionally requires both plans captured before their workout calendar dates and the follow-up plan captured at/after the response update. Same-day capture is uncertain without workout start time. These timestamps support provenance, not proof a recommendation caused the plan. Completed direction agreement compares only chosen vs recorded set-load direction; it does not establish adherence or execution of a prescription. Different rep structures may be legitimate progression, not failure.

## Verification

Synthetic tests cover Increase/Hold/Reduce, mixed directions, changed reps, missing/invalid values, future records/edits, overlap, Ignore/Modify, plan timing, week/year boundaries, unit independence, JSON roundtrip and nonmutation. Desktop/mobile browser coverage checks checklist navigation, historical read-only behavior, weekly empty state, offline reload and viewport fit. Physical iPhone/Safari acceptance remains manual.
