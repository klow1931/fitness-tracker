# v2.77 — Fast Start Training

v2.77 reduces the distance between opening Train and performing the first set without changing workout storage, training calculations, or the v2.75 execution-first logger.

## Train entry

A direct user tap on **Train** opens a launch surface that answers one question: what are you training today?

Priority is deterministic:

1. Resume an in-progress scheduled workout.
2. Resume any unrelated unfinished local workout before offering a new scheduled start.
3. Start today's scheduled workout, unless the active program requires review first.
4. If nothing is in progress or scheduled, start an empty workout or use an existing workout/template.

Programmatic routes that intentionally open a workout—history edits, schedule loading, Home's Start action, and existing internal flows—continue to use the established logger rather than a parallel workout editor.

## Compact logger

After Start or Resume, the existing logger remains the source of truth. Pre-workout setup fields are progressively disclosed behind **Workout options**:

- workout date and notes
- session timing controls
- session intent and plan-change explanation
- planned-work context
- checklist/template/repeat setup controls

Exercise entry, previous-performance context, set logging, RPE, completion controls, rest behavior, review, and save continue to use the existing implementation. Once meaningful work begins, v2.75's execution-first interface takes over.

## Data integrity

No schema migration is required. Schema remains v25. Loads remain stored internally in kg, display-unit conversion is unchanged, target RPE remains separate from actual RPE, and workout history/prescription evidence is not rewritten.

The launch UI explicitly prioritizes an unrelated unfinished draft over a new scheduled workout so entered work is not silently displaced by a new Start action.
