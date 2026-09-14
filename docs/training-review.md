# Training Review — v1.15

A read-only panel below Strength Progress on Home. Choose an analysis date, 1/4/12-week performance window, and Current-corrected or Historical as-recorded evidence. It does not prescribe loads or modify saved workouts, drafts, programs or blocks. Schema 15 is unchanged; no new persisted collection or migration is needed.

## Weekly review

The Monday–Sunday week containing the analysis date uses revisioned schedules known by the end of that date (or an earlier explicit API knowledge cutoff) in both modes. Later-entered schedules do not retroactively establish advance plans. Outcomes come from linked, dated workouts; scheduled completion counts follow scheduled dates while logged-workout counts follow actual workout dates.

Completed / (completed + explicitly skipped) is **resolved-session adherence**, not full-week adherence. Cancelled, unconfirmed and upcoming sessions are excluded. Moving a session out of the week does not make it a failure. A rescheduled count describes sessions currently in that week whose date was changed; the session list shows current outcomes and reasons. Unlinked workouts remain usable, but do not automatically complete a matching schedule.

## Performance and supporting evidence

The pure API is `LoadnoteReview.review(state, {asOf, weeks:1|4|12, retrospective:true|false, knownAt?})`. The UI defaults to current-corrected analysis; callers should choose their mode deliberately. The result exposes dates, block context, weekly outcomes, execution, warnings, per-exercise evidence and `decisionAllowed:false`.

Prescription, logged-load and demonstrated-capacity trends remain separate. Prescription trends use recorded snapshots on logged workouts, not inferred loads or uncompleted scheduled plans. Planned-set completion reuses the session-intent comparison; it is not scheduled-session adherence.

The model delegates trend calculation and the three-distinct-day guard to the existing block analyzer with an ephemeral date-range scope. That scope is never saved or presented as a real training block. Capacity uses the existing core RPE-aware estimator with positive finite load, 1–12 reps and actual RPE 6–10. Per-day maxima and first/last evidence dates are shown; percentages are endpoint comparisons, not physiological strength-growth rates or fitted slopes. Different rep schemes and effort can still affect interpretation.

Supporting sessions show workout ID/date, actual sets/RPE, recorded planned sets/target RPE, plan capture timestamp, individual estimates and exclusions. Missing RPE cannot be filled from target RPE, training maxes or known 1RMs. Late-captured plans are marked retrospective. Distinct exercise identities and variations are not pooled. Legacy entries without IDs use exact normalized names, with a warning rather than guessed alias matching.

If an exercise spans different block IDs or differing type/load strategy/progression context, aggregate trend percentages are withheld. Select a narrower range to inspect a consistent period. Unknown block context is disclosed. Return/re-entry, conservative and return-ramp context explicitly warns that planned-load progression is not equivalent to strength gain.

## Replay boundaries

Current-corrected mode uses current corrected workout/block records while excluding future workout dates. Historical mode reuses `LoadnoteReadiness.workoutsAt` to reverse later retained edit/delete/undo revisions and exclude workouts created after the cutoff. Future-captured prescriptions are withheld in historical mode. Each workout's block context is resolved through the existing dated block API.

Legacy saved-at gaps, bounded revision retention and undated identity-alias changes prevent a claim of perfect historical reconstruction. Warnings are displayed; this is a replay inspection tool, not a validated v2 backtesting engine. No recommendation, confidence percentage or outcome prediction is generated.

## Validation and privacy

Automated fixtures model conservative return-to-powerlifting, different actual RPE, missing prescriptions/RPE, separate variations, future workouts, later edits/deletions, late block/plan knowledge, schema-14 migration, JSON roundtrips, rescheduling and unit-invariant kg results. These are synthetic fixtures, not validation against the athlete's complete real training dataset. A fresh exported dataset is needed for that separate acceptance pass.

Browser tests exercise desktop/mobile-viewport controls, escaped text, nonmutation, dark-mode lb display and real offline reload. Full existing offline/update tests remain part of CI. Physical iPhone Safari remains a manual release check. No new network requests or external data sharing are added.
