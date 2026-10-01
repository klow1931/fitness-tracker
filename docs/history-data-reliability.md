# History & data reliability (v2.73)

## Goal

Workout History should be trustworthy enough to support long-term training analysis without making normal logging harder.

v2.73 improves review and recovery around saved data. It does not introduce automatic cleanup, destructive deduplication, or a new training policy.

## Workout History

History can now filter by:

- search text across exercise names, workout notes, session role, and session goal
- date range
- source: Calendar-linked, planned manual, repeated workout, or manual
- record status: all, needs review, or no current flags
- newest or oldest first

The history summary reports:

- saved sessions
- sessions with current review flags
- exact duplicate candidate groups
- the most recent JSON-backup date recorded on this device

These are descriptive status indicators. A review flag does not mean the workout is wrong.

## Duplicate protection

Loadnote treats duplicate detection as advisory.

A possible duplicate requires the same workout date and the same visible recorded content, including exercise order, set values, notes, and session-intent/source context. IDs and save timestamps do not make two otherwise identical entries different.

Possible duplicates are shown in History so the athlete can compare records and decide what to do.

When a new or edited workout matches an existing same-day record, the review screen warns before save and changes the primary action to **Save duplicate anyway** (or the equivalent edit wording). Loadnote still allows the save because two intentionally identical sessions can exist.

No duplicate is deleted, merged, or rewritten automatically.

## JSON import review

A selected JSON backup is fully parsed and structurally validated before the replacement action is available.

The import review shows:

- integrity-fingerprint status
- current training-value audit status
- workout/Calendar/planned-work relationship status
- collection-by-collection counts for added, changed, and removed records

Current local data is not replaced merely by selecting a file.

Only **Replace current data** commits the import. Immediately before replacement, Loadnote stores the current local state as an automatic recovery snapshot. A persistence failure leaves the current state unchanged.

Legacy backups without a Loadnote fingerprint can still be structurally validated and reviewed, but the UI states that file contents cannot be fingerprint-verified.

## Export behavior

Routine JSON backup behavior remains intentionally simple:

- structured Loadnote data is exported with the existing integrity manifest
- recovery snapshots are excluded
- photo binaries are excluded from routine JSON backup
- the locally recorded last-backup date is refreshed after export

Photo backup remains a separate action.

## Data authority

Current saved workouts remain the authoritative performance record.

Workout revision history remains audit/undo history and does not replace corrected current workouts.

Calendar revisions remain authoritative for scheduled prescriptions.

v2.73 does not change:

- schema v25
- internal kilogram storage
- RPE calculations
- estimated 1RM calculations
- training-max calculations
- progression thresholds
- phase or meet-cycle progression
- adaptive programming policy
