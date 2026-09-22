# Context feedback — v2.6.3 / v2.6 Part 2

New feedback snapshots optionally retain versioned block ID/type, interpreted phase, load strategy, progression intent and conflict status. Existing JSON backups remain compatible (schema 16); old events without the field are unknown, not backfilled. The app's existing snapshot clone/backup path preserves the optional field. Existing feedback keys and live rules are unchanged.

## Observation contract

`LoadnoteDecisionContextAnalysis.analyze(state,{asOf})` reconstructs workouts through the report cutoff using retained revisions. Responses edited after that cutoff are withheld because response revisions cannot be reconstructed. The original unique lift/workout attribution still runs before context filtering; an excluded newest event does not donate its outcome to an older overlapping event.

Cohorts separate lift, exact exercise ID, raw block type, interpreted phase, load strategy and progression intent. Unsupported/general, missing, conflicting or unknown context is not comparable. Baseline context is looked up from revisions known when the response snapshot was saved; outcome context from revisions known by its workout date. Both must match the saved context and stay in its block. Cohorts can combine observations from different blocks only when each individual baseline/outcome pair stays within its own matching block. This does not guarantee equivalent athletes, programs, rep ranges, recovery or equipment.

Every event retains its exclusion reason and outcome-workout link when available. Counts remain visible at any sample size. A response-specific mean requires at least three included, uniquely attributed outcomes within that cohort. This is a UI sparse-data floor, not statistical confidence. Estimates reuse the existing RPE-aware capacity evidence; no prescription change or bar-weight increase becomes a physiological-strength claim. Recorded Accept/Modify/Ignore is intent, not verified compliance. Aggregated legacy reports remain descriptive and are not context matched.

## Rule experiment

`compare(state,{asOf,lift,days:84})` runs existing walk-forward replay twice with identical cutoff dates, as-recorded mode and report-date-bounded workouts. One variant uses current policy; the other raises both normal and conservative Increase thresholds by one percentage point. Nothing persists, selects a winner, changes live policy, or recommends an exact load. API windows are limited to 180 days and the UI defaults to 84. The view reports direction/abstention counts and an audit of every replay date.

Report-date outcome clipping prevents later workouts or retained later corrections from entering the report. Historical reconstruction still has legacy timestamp, undated alias and pruned-revision limitations. Multiple replay dates may share an outcome; replay totals are not independent trials. This experiment is sensitivity analysis, not evidence that a candidate policy would cause better results or that its plan would have been followed. Candidate outcomes follow actual recorded training, not hypothetical training.

## Testing and release limits

Use synthetic fixtures only. Test missing/changed/later-entered context, response thresholds, future records, units, import/export roundtrip, chronology and no mutation. Browser coverage checks collapsed navigation, exclusions, read-only comparison and offline availability on desktop/mobile Chromium. Physical iPhone/Safari remains a manual acceptance check. No automatic threshold tuning or feedback-derived personalization is enabled.
