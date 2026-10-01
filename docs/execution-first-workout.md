# Execution-First Workout Screen (v2.75)

## Purpose

The most frequently used Loadnote interface is the active workout. v2.75 reduces the amount of setup/editing UI competing with the set currently being performed.

This release is a presentation layer only. The existing workout logger, schedule, prescription, rest-timer, and save/review modules remain authoritative.

## When execution mode activates

Execution mode remains off while a manual workout is still being set up.

It activates when either:

- the current draft belongs to a scheduled workout
- an explicit workout start timestamp exists
- a named strength exercise has meaningful entered work such as reps/hold, load, RPE, or completion
- a named cardio exercise has duration, distance, or completion

A name by itself is not enough to switch the interface into execution mode.

Editing an already-saved workout never uses execution mode.

## Workout options

During execution, secondary setup controls are hidden from the normal path:

- date and workout notes
- checklist/template/repeat controls
- session timing setup
- session intent and manual planned-work capture
- logger helper/status text
- Focus mode controls
- add Strength/Cardio controls
- Clear and Save as Template
- legacy rest controls

They remain available through **Workout options**. Opening options reveals the original controls in place; it does not clone, replace, or resave them.

The primary Finish/Review action remains in the sticky training cockpit. Legacy finish/review buttons and the mobile-dock Finish action stay hidden during execution, including when Workout options are open.

## Exercise hierarchy

The current exercise remains expanded.

Completed exercises and later exercises collapse to a compact exercise summary. They can be reopened with **Show sets**. Reordering, swapping, removing, adding sets, exercise notes, and other edit controls remain available through Workout options and the existing row actions.

No exercise order or performed work changes automatically.

## Set hierarchy

Within the current exercise:

- the current set receives the strongest visual treatment
- completed sets are quieter
- later unfinished sets are quieter
- previous-performance and per-set target helper rows are shown only for the current set during execution

This changes presentation only. Set values and completion state stay in the existing logger DOM and draft.

## Rest timing

The existing deadline-based rest timer remains authoritative.

When rest is active, the training cockpit mirrors:

- remaining time
- paused/running state
- Pause / Resume
- +30 seconds
- Stop

The legacy preset controls remain available through Workout options. Rest state continues to persist through refresh using the existing rest-timer storage behavior.

## Data and training integrity

v2.75 does not change:

- schema v25
- workout persistence
- draft persistence
- internal kilogram storage
- display-unit conversion
- target RPE vs actual RPE separation
- estimated 1RM calculations
- training-max calculations
- program progression
- meet-cycle progression
- adaptive programming policy
- reviewed prescription authority
