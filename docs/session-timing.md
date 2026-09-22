# v2.8 — Session timing and plan revisions

Session intent optionally contains `timing: {version:1, startedAt, sessionDate, revisions:[{recordedAt,plan}]}`. Start/revision timestamps are ISO UTC; sessionDate preserves the local workout date selected at start. Stored loads stay kg. Schema 16 and draft version 3 accept this optional field through the existing validated session-intent path. Older data is not backfilled and needs no migration. Imports validate timestamps, dates, strictly ordered revisions, matching plan capture times, and a maximum of 200 revisions.

## Explicit athlete actions

Start workout now works only for today's new draft, once. It is disabled logically for saved-workout edits, historical and future dates. Reloading, opening the logger and loading templates never starts a workout. A start-only draft is meaningful and survives reload. Local draft writes happen before timing is accepted; failures roll back in-memory timing/plan changes.

The first prescription remains the original. Subsequent Use entered work as plan actions append snapshots with fresh capture timestamps, including in scheduled drafts without changing the scheduled prescription. Removing an unscheduled plan appends a null revision instead of deleting its original history. Scheduled removal retains the existing clear-workout restriction. Revisions do not erase entered actual RPE or completion checks; initial pre-start captures retain the existing target-RPE/actual-RPE clearing workflow. Use session deviation notes to explain the change.

Saved-workout edits cannot recapture/remove plans or acquire a new start. Actual-work edits remain possible with existing undo/revision support. Duplicating/loading a workout creates a new draft with fresh plan provenance, never copies the prior start. Clearing a draft explicitly discards that draft's timing along with its other contents.

## Interpretation

An original/revised plan captured at/before an explicit start is before-training; one after the start is after-start (not proof of physiological exercise start or that work was still in progress). If the workout date differs from the date recorded at start, timing is unknown. Without a start, earlier-calendar-date plans use the existing before-training inference, later-date plans are retrospective, and same-day timing stays unknown. Legacy day comparisons use UTC capture date; this is weaker provenance than explicit local-date starts. No clock/device timestamp proves the athlete actually followed a plan.

Weekly follow-up comparison still uses original prescriptions, not revision selection after seeing results. It now accepts same-day original plans if a valid matching explicit start establishes prior capture. Follow-up plan must still be captured after the saved response. Live decision thresholds, historical recommendations and training maxes are unchanged. Detailed revisions are visible in the logger's plan disclosure; workout review shows original timing and revision count. Backups retain all valid revision snapshots.

## Verification

Synthetic tests cover starts, duplicate starts, historical-date rejection, malformed timing, ordered revisions, immutable originals, removals, unknown legacy timing, date changes, draft normalization, backup roundtrip and same-day follow-ups. Browser regressions cover offline reload, saving/editing, original versus revision loads, start-only drafts and failed local storage. Existing full Node and browser/offline suites remain required. Physical iPhone testing is separate from mobile Chromium.
