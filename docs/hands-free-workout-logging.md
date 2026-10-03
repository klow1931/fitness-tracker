# Hands-Free Workout Logging

v2.81 extends the v2.80 Realtime Voice Companion with a narrowly scoped write surface for the active workout draft.

## Authority boundaries

- The existing workout form/logger remains the only workout-entry engine.
- Voice updates the same DOM inputs and completion checkbox used by touch entry, then dispatches the normal `input`/`change` events so existing draft autosave, execution state, cockpit, and review logic run normally.
- Voice does not write directly to `data.workouts`, local history, reviewed program prescriptions, Decisions state, or adaptive-programming records.
- A workout becomes saved history only through the existing Review/Save flow.

## Supported voice mutations

`log_current_set`
: Records stated actual performance on the current strength set and marks that set complete.

`update_current_set`
: Records partial values without completing the set. This is the preferred path when RPE is still missing.

`correct_last_voice_entry`
: Patches only the most recent set entry created by Voice Companion.

`undo_last_voice_entry`
: Restores the most recent voice-entered set to its pre-voice draft state.

No voice tool exists for deleting sets/exercises, editing saved sessions, changing prescriptions, changing training maxes, accepting adaptations, or modifying programs.

## Unit handling

The athlete’s spoken load must have an explicit unit unless the utterance clearly refers to the current displayed load. The browser logging adapter converts the stated unit into the athlete’s current display unit for the workout form and returns explicit `weightKg` evidence. The existing logger remains responsible for final conversion into internal kg storage when the workout is reviewed/saved.

## RPE handling

Voice writes only actual RPE into `.set-rpe`. Planned/target RPE remains separate. If the athlete gives load/reps without RPE, Voice Companion should leave actual RPE blank and ask for it rather than borrowing the planned target.

## Reliability

- Realtime function calls are already de-duplicated by call ID in the v2.80 transport.
- v2.81 adds a short duplicate-completion guard for an identical repeated set payload so a repeated provider action cannot immediately advance and fill the next set.
- Voice actions maintain a small session-local undo stack. Undo restores the prior draft values and never rewrites saved history.
- The logger draft remains recoverable across refresh through the existing `loadnote-workout-draft-v1` path.

## Privacy

Microphone behavior remains unchanged from v2.80: voice starts only after explicit athlete action, hides/mutes with app visibility handling, and releases media tracks when the session ends. The long-lived provider credential remains server-side; the browser receives only the short-lived Realtime credential.
