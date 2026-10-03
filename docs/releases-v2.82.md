# Loadnote v2.82.0

## Proactive Coach Companion

v2.82 lets the workout-scoped Voice Companion speak when a small set of deterministic training events are worth surfacing instead of requiring the athlete to ask every time.

### Added

- **Quiet / Normal / Proactive** cue levels inside Coach Companion.
- Persistent local cue preference with a session-only **Pause cues** control.
- Voice commands for reading/changing cue level and pausing/resuming unsolicited coaching.
- Natural rest-completion cues from the existing deadline-based rest timer.
- Deterministic actual-RPE vs target-RPE observations.
- Exercise-transition cues when entered work for the current exercise is complete.
- One concise workout-completion cue when all meaningful entered work is complete.
- Cooldown, duplicate-event suppression, and speech-activity suppression so Coach avoids interrupting the athlete or itself.
- Important queued cues can wait briefly until the athlete stops speaking rather than talking over them.
- Bounded realtime announcement transport that preserves the deterministic cue’s training facts and does not add new programming authority.

### Guardrails

- Proactive coaching does not alter programs, prescriptions, training maxes, adaptations, Decisions state, or saved workout history.
- RPE cues compare actual RPE with approved target RPE; target RPE is never written as actual RPE.
- The final workout set produces one completion moment rather than stacked completion + RPE-deviation chatter.
- Manual rest-timer stop does not masquerade as natural rest completion.
- “Stop coaching” pauses unsolicited cues without ending Voice Companion or hands-free logging.
- Proactive mode means more eligible deterministic cues, not more autonomous AI decision-making.
- No recovery/readiness/medical measurements or diagnoses are inferred.

### Compatibility

- Release version: **2.82.0**
- Data schema: **v25** unchanged
- No migration
- Internal strength load storage remains kg
- No changes to kg/lb conversion, RPE/e1RM/training-max math, progression, fatigue/status, adaptive programming, phase/mesocycle progression, meet logic, or workout-history semantics

See `docs/proactive-coach-v2.82.md` for the event and safety architecture.
