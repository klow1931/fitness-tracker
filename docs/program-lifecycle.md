# Active program lifecycle (v2.61)

## Purpose

The lifecycle controller connects existing reviewed programming features into one continuous athlete workflow. It does not generate a second program, infer new prescriptions or bypass existing approval rules.

The intended path is:

**reviewed program → current week/phase → train → resolve evidence → timely review when eligible → event/program closure → frozen transition baseline → next-program handoff**

## Supported program types

The controller currently understands scheduled phase-based programs, flexible mock-meet cycles and flexible competition-meet cycles. If more than one scheduled program covers the current date, Loadnote reports an ambiguous overlap and does not guess which plan is active.

## Next-action ordering

For the selected program, Loadnote derives one workflow next action from stored facts. Important states include resuming a linked workout draft, finishing an unrelated open workout before a programming review, resolving earlier scheduled sessions, reviewing an eligible week/phase, starting today's reviewed session, recording event results, freezing the transition baseline, resolving or launching the next-program handoff, and showing the next scheduled/upcoming session when no review is due.

The controller only routes. Prescription changes still come from the existing weekly/phase review engines and still require explicit athlete approval.

## Review windows

A completed week/phase does not create a permanent blocker. A review owns the next step only when the reviewed period is fully resolved and the existing review engine can still act on untouched future training. When that window passes, Loadnote keeps the missing review visible as historical context but does not force a stale review or rewrite past/current training. This prevents older cycles from becoming unusable after upgrading to v2.61.

## Program closure and meet results

Phase programs can freeze their existing transition baseline after the final scheduled date. Meet cycles can now freeze the same class of immutable transition evidence after the event endpoint. The meet transition includes the cycle's saved weekly-review history and, when recorded, athlete-entered event bests/total. Event results remain their own evidence class and do not become estimated capacity, known/tested 1RM or training max.

The stored transition record remains version 1. Meet-cycle fields are additive (programType and event metadata) so schema v25 remains unchanged and rollback/import compatibility is preserved where practical.

## Safety and integrity

- unresolved Calendar/workout relationships remain blockers
- the original reviewed program remains immutable
- completed workouts are never rewritten by the lifecycle controller
- review changes remain future-only and athlete-approved
- kg remains the stored weight basis; display units are independent
- missed review windows do not imply failure, nonadherence, fatigue or poor recovery
- event results are user-entered and are not verified federation records
- no background AI chooses lifecycle actions

## Non-goals

v2.61 does not add a new load progression algorithm, automatic review approval, automatic event attempt selection, automatic training-max progression, automatic rescheduling, physiological readiness diagnosis or a new training-data schema.
