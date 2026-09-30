# Programming workspace simplification (v2.68)

## Purpose

v2.68 reduces the number of competing programming controls shown in Coach → Programming and separates **hard constraints** from **planning defaults**.

The product now presents one **Program planner** first. Existing builders remain available for compatibility and specialized use, but they are collapsed under **Program setup & alternate tools** instead of appearing as equally important choices.

No training dose, adaptation threshold or phase policy changes in v2.68.

## One primary route

The Program planner derives a deterministic next action from already-saved programming context:

- no programming setup → create the setup
- return/re-entry goal or returning consistency → quick 4-week return/base block
- general/strength goal → main Program designer
- meet goal or an optional event date → guided meet-prep flow
- reviewed meet cycle waiting for scheduling → review/schedule it
- scheduled current/upcoming phase or meet cycle → return to current-program workflow
- hypertrophy emphasis → adopt an existing program because Loadnote does not yet claim a dedicated hypertrophy generator

The route is organizational only. It does not create, approve or schedule training automatically.

## Builder roles

### Program designer

The former **Phase-based program builder** is presented as the main **Program designer**.

It still uses the same reviewed accumulation → strength → deload engine, explicit training maxes, exercise-role identities, exposure selection, starting-prescription evidence and athlete approval.

For meet preparation, this becomes **lift setup**, then continues into the full meet timeline after save.

### Quick 4-week return block

The existing four-week builder remains intact for backward compatibility and return/re-entry use.

It is no longer presented as a peer to the main Program designer. Its UI is labeled **Quick 4-week return/base block** so athletes are not asked to choose between two apparently equivalent program generators.

### Meet timeline

Meet preparation is presented as the second part of one guided flow:

1. confirm lift setup in Program designer
2. choose total cycle length, peak, taper and event date in Meet timeline
3. review the whole-cycle v2.67 quality gate
4. save
5. schedule separately

## Programming setup: defaults vs constraints

The programming profile is shown as **Training setup**.

Hard constraints remain enforced:

- available training days
- maximum session time
- actual equipment access
- avoided exercise identities
- returning-status restrictions where applicable
- current competition/variation identity mappings

Planning context/defaults include:

- goal
- experience
- reported priorities/notes
- optional event date

The optional event date is now a default for meet planning rather than a second independent source of truth that must exactly equal the reviewed cycle date.

## Event-date behavior

Before v2.68, a phase setup could be rejected because its standalone sequence overlapped the profile event date, even when that phase record was only being used as lift setup for the separate meet-cycle builder. A meet cycle could also be rejected unless its event date exactly matched the profile event date.

v2.68 changes that workflow:

- a profile event date overlapping a standalone phase setup produces an explicit review warning instead of blocking lift setup
- an explicitly reviewed meet-cycle event date may differ from the profile default
- the mismatch is recorded as a warning
- changing the profile is not required simply to preview/approve a different cycle date
- hard date validity remains enforced by the meet-cycle engine: the event must still be inside the final program week, and mock meets retain their weekend rule

## Week-start behavior

The underlying reviewed phase/program records remain Monday-based for compatibility.

In the UI, choosing a non-Monday **start intent** no longer produces an avoidable error. The Program designer and quick 4-week builder move it to the next Monday and show the resulting date before preview.

Example:

- athlete selects Sunday 2026-10-11
- actual program week begins Monday 2026-10-12

The stored program still uses the existing Monday-based week model; no migration is needed.

## Profile edits after review

Previously, exact programming-profile snapshot equality could prevent scheduling even when only soft context such as notes or the event-date default changed.

v2.68 re-runs the current hard constraints before scheduling but no longer requires the entire profile snapshot to be byte-for-byte identical.

Examples:

- changed notes with the same compatible days/time/equipment → reviewed program may still schedule
- changed event-date default while the reviewed cycle remains valid → may still schedule
- removed a required training day → scheduling is blocked
- reduced time below the reviewed program budget → blocked
- removed required equipment → blocked
- changed competition exercise roles → blocked

Historical review snapshots are still retained; the old review is not rewritten.

## UI density

Coach → Programming now shows:

- current program/reviews/intelligence
- one Program planner card
- one collapsed **Program setup & alternate tools** section

The collapsed section contains Training setup, Quick 4-week return block, Program designer and Adopt an existing program.

This preserves existing functionality while keeping rarely needed creation tools out of the default view.

## Compatibility

v2.68 does not change the training-data schema. Schema v25 remains unchanged.

Existing reviewed programs, phase programs, meet cycles, Calendar records, workout history, decision snapshots, quality gates and transition records remain valid.

The full end-to-end cycle rehearsal originally planned for v2.68 moves to the next release after this UX simplification is validated.
