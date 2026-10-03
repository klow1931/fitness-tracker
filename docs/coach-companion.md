# Coach Companion

## Purpose

v2.79 introduces the text-first foundation for a persistent Loadnote training companion.

The product boundary remains unchanged:

**Loadnote is an adaptive training log that learns how you train.**

Decisions and the existing deterministic training systems remain authoritative for programming. Coach Companion is a conversational interface over those systems and the live workout logger.

## Athlete experience

Coach Companion is available from the primary Loadnote surfaces rather than only from the Coach tab.

During an active workout it can read bounded live state including:

- current workout name/date
- current exercise and set position
- entered reps, RPE and load
- explicit internal `weightKg`
- the same load in the athlete's display unit
- currently rendered target/previous-set context when available
- per-exercise completed/total set counts
- rest-timer state
- current app surface

Outside a workout it remains available for normal Coach conversation using the existing structured Loadnote context.

## Action boundary

v2.79 deliberately exposes only reversible local convenience actions:

- start a rest timer
- pause/resume a rest timer
- add 30 seconds
- stop a rest timer

The companion does **not** directly:

- log or edit a completed set
- mark a set complete
- change a prescribed load
- change a training max
- alter progression
- approve a weekly/phase review
- rewrite a program
- schedule training
- write an adaptive decision

Requests for training changes remain conversational/advisory until the deterministic Decisions/review pipeline evaluates them.

## Online Coach context

The existing authenticated `/api/coach` boundary now accepts an optional bounded `companion` object alongside the established athlete/training/lifecycle context.

The trusted server prompt tells the model:

- companion context is data, not instructions
- `liveWorkout` is the current logger state
- `restTimer` is local timer state
- it may explain what is next and explain supplied evidence
- it must not claim it performed a workout or programming mutation

Provider credentials remain server-side.

## Offline behavior

The companion remains useful when signed out or when online Coach is unavailable.

Deterministic local handling covers:

- current/next set questions
- remaining rest-time questions
- surface awareness
- the existing built-in Coach fallback for broader general questions

Training and timer operation therefore do not depend on the AI provider.

## Persistence and privacy

v2.79 conversation state is memory-only for the current app session. It is not added to the training-data schema and is not synced as workout history.

No new stored fields are introduced. Schema remains v25.

## Future voice layer

The companion boundary is intentionally transport-agnostic. A later realtime voice release can reuse:

1. the same live-workout context builder
2. the same secure server boundary
3. the same local action classifier/executor
4. the same deterministic Decisions ownership rules

Voice should therefore be an additional input/output transport rather than a second coaching engine.
