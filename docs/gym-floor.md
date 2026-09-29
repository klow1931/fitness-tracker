# Gym-floor workout experience (v2.62)

## Goal

The workout logger is Loadnote's highest-priority interface. v2.62 improves speed and resilience between sets while leaving the existing workout, programming and persistence models in place.

## One-handed mobile dock

When Train → Log contains an unfinished draft, mobile viewports show a compact fixed dock with the current exercise/set, the existing deadline-based rest timer, and Finish. Finish opens the normal workout review; it does not bypass review or save directly.

Navigating away does not discard the draft. The Train navigation receives a small in-progress indicator while the device-local draft contains work. When the browser visual viewport indicates a large keyboard-height reduction, the dock and mobile bottom navigation hide to avoid covering numeric inputs. This is an ergonomic heuristic, not a platform-level keyboard API.

## Between-set entry

Numeric fields advertise mobile-friendly input modes: reps use numeric; load, RPE, duration, distance and heart rate use decimal.

Enter advances through the current set. A valid RPE Enter action uses the existing quick-entry completion path, including existing rest-timer behavior in Gym mode. Completion advances to the next unfinished set and can focus a blank manual set without inventing any value.

## Previous-set context

Each strength set may show the matching set from the latest prior session for the same exercise identity/name and tracking mode. A blank set may expose **Use last**.

Use last copies only:
- load
- reps, or hold duration

It does not copy RPE, completion/check state, or readiness/fatigue interpretation.

Workout storage remains kilograms. Prior stored kg are converted with the existing unit helpers before being placed into a display-unit input. Normal session save converts the display value back to storage kg.

## Destructive actions

Blank draft rows remain quick to remove. A set or exercise containing entered work requires confirmation before deletion so a stray gym-floor tap does not silently destroy the draft.

## Offline and recovery behavior

Workout drafts and saved training remain local-first. v2.62 does not add a network call to logging. Once the app shell is loaded, a workout can still be reviewed and saved with the network unavailable.

Existing pagehide/visibility draft persistence and deadline-based rest timer recovery remain the recovery mechanisms after suspension or reload.

## Non-goals

v2.62 does not change training progression or adaptation rules, add background synchronization, add a new workout schema, infer RPE, automatically copy prior performance into programmed work, or claim browser keyboard emulation proves iOS/Android physical-device behavior.
