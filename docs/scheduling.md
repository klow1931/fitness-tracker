# Plan Your Week (schema 15)

Home's This week card and Calendar's Scheduled sessions list share the same records. Create a date/name, choose a template, program day or current logger prescription, and optionally set role, goal and block. A snapshot is captured when scheduling; later template/program changes do not rewrite it. Starting a scheduled program snapshot does not itself advance program progression.

Start loads a linked draft, with actual RPE blank. The workout date defaults to today even when the planned date differs. Existing draft replacement requires confirmation. Successful workout persistence establishes completion; merely starting/reviewing does not. Failed writes preserve the draft. Clearing starts an unscheduled workout; copying/repeating a workout does not reuse its schedule link. One schedule cannot be linked to multiple current workouts.

Use Change / reschedule to move the date, explicitly skip or cancel, with a reason. Completed sessions cannot be changed through these controls. Revisions preserve the original date and prescription. A past scheduled session without a saved workout is unconfirmed. Deleting a linked workout makes the session unresolved again rather than leaving a phantom completion.

## Metrics

This week and the displayed Calendar month show completed, skipped, cancelled, unconfirmed and upcoming counts. Resolved-session adherence is completed / (completed + explicitly skipped). Upcoming, unconfirmed and cancelled entries are excluded and the definition is displayed beside the rate. This is not full calendar adherence when entries remain unresolved. Planned-set execution remains a separate session-intent metric.

## Storage and replay

`scheduledSessions` contains IDs and ordered full-context revisions with ISO `recordedAt` timestamps. Dates are local calendar dates; stored loads remain kg. Older backups gain an empty collection without rewriting workouts. JSON backups and recovery state include schedules; import validates schedule histories and linked prescriptions before replacement.

`LoadnoteSchedule.list(records, knownAt)` returns snapshots known by the timestamp. `rows` and `summary` require `asOf`; supplying `knownAt` also requires linked workout creation to be recorded by that cutoff. For full historical replay, pass workout snapshots from the existing workout-revision replay API rather than today's edited records. No future workouts are counted.

Plans entered after their scheduled date are labeled retrospective; revisions made after the revised scheduled date are labeled late changes. Keep these qualifiers when consuming adherence for future decisions. No automated training decision is enabled here.

## Validation

Node coverage includes three sessions/two completions/one reschedule, historical snapshots, unknown/skipped/cancelled distinctions, stale and duplicate links, preservation of the kg prescription with lb drafts, import shape and schema migration. Browser coverage includes offline scheduling, draft reload, successful completion and failed schedule writes. Physical iPhone Safari acceptance remains a device check.
