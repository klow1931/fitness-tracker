# Loadnote v0.9 — Performance & Fatigue Engine

v0.9 adds a deterministic Performance & Fatigue Engine on top of the v0.8 adaptive mesocycle system.

## Highlights

- Training-status score from 0–100 (a planning signal, not a medical measure)
- 7-day volume vs recent 28-day weekly average
- 14-day average RPE signal
- Recent exercise performance direction
- Four-week adherence estimate when an athlete profile is available
- High/medium training-stress flags
- Conservative recommendations: progress, continue, hold, or temporarily reduce training stress
- Dashboard integration with score, load ratio, RPE, performance direction, and flags
- Schema migration v8 → v9

## Design principle

The engine is deterministic. It does not diagnose recovery, fatigue, injury, or readiness. AI can later explain the signals, but it should not invent the underlying metrics.
