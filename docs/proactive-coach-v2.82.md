# Proactive Coach Companion — v2.82

## Purpose

v2.82 makes the workout-scoped Voice Companion useful without requiring the athlete to initiate every interaction. Loadnote detects a small set of meaningful training events deterministically, applies relevance/cooldown rules, and only then asks the existing realtime voice layer to speak the approved cue.

The architecture is intentionally:

**Workout event → deterministic Loadnote policy → relevance gate → spoken cue**

It is not an autonomous AI observer deciding when training should change.

## Cue levels

The athlete can choose a persistent local preference:

- **Quiet** — essential cues only, such as rest completion and workout completion.
- **Normal** — Quiet plus meaningful exercise transitions and larger RPE-vs-target deviations.
- **Proactive** — Normal plus smaller useful observations that meet deterministic evidence thresholds.

“Stop coaching” / “pause coaching” pauses unsolicited cues for the current voice session. It does not end the microphone session, disable on-demand conversation, or disable hands-free workout logging. Starting a new Voice session resumes cues at the athlete’s saved cue level.

## Deterministic events

### Rest completion

The existing deadline-based rest timer emits a dedicated event only when rest expires naturally. Manually stopping the timer does not create a rest-complete coaching cue.

Rest completion is an essential cue and may include the next set from the live Companion context.

### RPE deviation

RPE comparison uses the current completed set’s **actual RPE** and the matching approved prescription’s **target RPE**. Target RPE is never copied into actual RPE.

- Difference below 0.5 RPE: no proactive cue.
- Difference of 0.5 RPE: Proactive mode only.
- Difference of 1.0 RPE or more: Normal and Proactive modes.

The cue reports the observed difference. It does not automatically change the next load or program. Decisions remains authoritative.

### Exercise transition

When all meaningful entered work for an exercise is complete and another entered exercise remains, Normal and Proactive modes may announce the next exercise.

### Workout completion

When all meaningful entered work is complete, Loadnote emits one essential completion cue. The final set does not also trigger a second RPE-deviation cue, avoiding back-to-back chatter.

## Interruption and repetition rules

- Proactive cues require an active, connected Voice session.
- Loadnote does not issue unsolicited speech while the athlete is speaking or while the assistant is already speaking.
- Important/essential cues may wait briefly for speech to end; ordinary cues are dropped rather than becoming stale.
- Nonessential cues have a cooldown between deliveries.
- Identical event keys are deduplicated for a bounded period.
- Essential cues such as rest/workout completion may bypass the ordinary cooldown, but still respect pause and speech activity.

## Voice rendering boundary

The deterministic event owns the training facts. The realtime voice transport receives a bounded instruction to speak that cue concisely while preserving every supplied number/fact and adding no new programming advice, diagnosis, motivation, or recovery claim.

## Training-data boundary

v2.82 does not expand the training write boundary introduced in v2.81.

Voice may still write only to the current unsaved workout draft through the existing logger path, with correction and Undo. Proactive cues cannot:

- edit saved workout history;
- delete exercises or sets;
- change prescriptions or programs;
- change training maxes;
- accept/apply adaptations;
- modify Decisions state;
- invent fatigue, readiness, recovery, or medical measurements.

## Data and compatibility

- Schema remains **v25**.
- No migration.
- Internal strength load remains kg.
- No change to kg/lb conversion policy.
- No change to RPE/e1RM/training-max calculations.
- No change to progression, adaptive programming, fatigue/status, phase/mesocycle, meet-cycle, or workout-history semantics.
- Cue level is local UI preference state and is not treated as training evidence.
