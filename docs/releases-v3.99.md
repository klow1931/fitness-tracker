# Loadnote v3.99.0 — Faster Between-Set Logging and Mobile Undo

## Focus
A targeted follow-up to v3.98.0. Reduce actions between performed sets while protecting actual performance, recovery, and workout history.

## Implemented
- **Repeat completed set:** the existing training cockpit offers a contextual `Repeat set N` action only when the current set has no entered load, reps/hold duration, or actual RPE and there is a valid earlier completed set in the **same exercise**. The most recent eligible preceding set is used. It copies performed display-unit load and reps or hold duration; it never copies effort, completion, or a different exercise.
- **Rest-friendly interaction:** repeat fills the current set in one tap without automatically opening the numeric keyboard. The athlete then records the actual RPE in the existing single-tap quick entry.
- **Mobile Undo:** the existing quick-completion Undo is now also offered in the mobile in-workout dock when it is safe. It disappears after Undo or edits that invalidate the checkpoint; no new undo state/history system was introduced. Touch targets remain at least 46px and compact layouts adjust grid columns.
- **Missing versus zero loads:** read-only history and target displays preserve unknown load as missing rather than silently showing 0. Explicitly logged zero loads remain valid. Existing internal kg storage and display-unit conversion paths are unchanged.

## Acceptance
1. Given a completed set and a blank next set of the same exercise, `Repeat set N` fills only load and reps/hold in **one** tap. RPE stays blank and the next set is not checked complete.
2. The action does **not** appear for a previously uncompleted or invalid set, already edited destination, prefilled target, explicit zero destination load, or typed actual RPE.
3. Repeating a zero-load, duration-tracked completed set preserves explicit zero and the hold duration. It does not infer a load when source data is missing.
4. Quick completion exposes one-tap mobile Undo while its checkpoint is valid; Undo restores the previous effort and preserved load/reps, and resets the rest timer as supported by existing logic.
5. Mobile dock controls stay usable at **320px and 390px** widths without horizontal overflow.
6. Refreshing after repeat recovers the new entered draft without creating history; actual workouts only save through existing explicit Review → Save.
7. Existing workout recovery, previous performance, target RPE, kg/lb, and program progression tests must remain green; CI includes the new Chromium and iPhone WebKit browser spec.

## Boundaries
- Release **3.99.0**, unsigned build **35900**, schema **34** unchanged; no data migration.
- No new training engine, auto-completion, guessed actual RPE, account integration, or silent adaptation.
- Rollback baseline is the merged v3.98.0 release (main at `884dca9`).
- Physical iPhone Home Screen/Android ergonomics and formal accessibility remain to be confirmed by human-device testing. CI does not certify them.
