# Training Prescription & Session Intent (schema 14)

Session intent is optional athlete-entered context stored on a completed workout. It may contain a session role, goal, deviation reason and an immutable prescription snapshot. A missing prescription means **unknown**, not skipped or failed training.

## Separation contract

- `sessionIntent.prescription.plannedExercises` records what was intended before execution.
- `workout.exercises` records what was completed.
- Planned RPE is stored as `targetRpe`; completed RPE remains `rpe`.
- Planned load and completed load remain kg internally and are never converted into known 1RM or estimated capacity.
- The prescription records its capture time and source: manual, template, program or repeated workout.

## Comparison semantics

Set completion reports how many planned set positions have corresponding completed sets. Exact completion additionally requires the planned reps or duration and load to match. It is descriptive adherence evidence, not a quality judgment. Extra completed sets do not inflate completion above 100%.

Modified sessions can carry an athlete-selected reason and free-text note. Loadnote reports unexplained changes but does not infer why a session changed.

## Historical behavior

Existing schema 13 workouts migrate unchanged and have no prescription evidence. New session intent is part of the workout and therefore participates in workout edit revisions, deletion undo, backup import/export and Decision Readiness point-in-time replay.

## Safety boundary

Schema 14 does not generate, approve or apply load changes. `decisionAllowed` remains `false` until a later v2 release defines a separate, explainable decision contract.
