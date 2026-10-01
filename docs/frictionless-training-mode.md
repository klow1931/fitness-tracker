# Frictionless Training Mode (v2.74)

## Goal

The training screen should minimize navigation and cognitive overhead between sets without changing the prescription or hiding what the athlete actually logged.

v2.74 adds a focused, read-only training cockpit around the existing logger. The logger/session modules remain authoritative for performance data and storage.

## Training cockpit

When an active workout draft exists, the workout screen shows a compact sticky cockpit with:

- session/program label when available
- current program week/phase context when the scheduled workout belongs to the selected reviewed lifecycle
- current exercise and set position
- completed-set progress
- elapsed minutes when an explicit session start time exists
- the current captured target
- the same-position set from the previous exact exercise exposure

The cockpit is hidden during historical workout editing so edit/revision semantics remain unchanged.

## Current-set actions

### Use target

**Use target** copies only the captured planned load and reps/hold duration into the current actual-work row.

It does not copy target RPE into actual RPE and does not mark the set complete.

The immutable planned-work snapshot remains separate from performed work.

### Load nudges

Load nudge controls operate on the visible input value only:

- kg display: ±1.25 kg and ±2.5 kg
- lb display: ±2.5 lb and ±5 lb

The buttons do not write directly to stored workout data. The existing workout save pipeline continues to convert display values to internal kilograms.

## Set and exercise transitions

Within the same exercise, one-tap RPE completion continues to advance focus to the next unfinished set.

When the completed set is the final set before the next exercise, v2.74 pauses automatic keyboard focus and shows a lightweight transition:

**Current exercise complete → Up next → Start next exercise**

Starting the next exercise scrolls/focuses the next unfinished set. This is not a confirmation dialog and does not alter the exercise order.

## Prescription context

For a Calendar-linked workout, the cockpit exposes the existing **Why?** context. That opens the approved-target explanation already derived from the current Calendar revision, phase review history, and previous exact-identity performance.

No new training recommendation is created by the cockpit.

## Timing

If the existing session timing record has a valid start timestamp for the workout date, the cockpit displays elapsed whole minutes.

If no timing record exists for today, the cockpit exposes **Start timer**, which calls the existing session timing workflow. Timing does not affect prescribed load, RPE targets, fatigue status, or adaptive decisions.

## Compatibility

v2.74 does not change:

- schema v25
- internal kilogram storage
- planned-work snapshot semantics
- RPE calculations
- estimated 1RM calculations
- training-max calculations
- progression thresholds
- phase or meet-cycle progression
- adaptive programming policy
- History/import behavior introduced in v2.73

The feature is a UX layer over existing workout, schedule, timing, and previous-performance data.
