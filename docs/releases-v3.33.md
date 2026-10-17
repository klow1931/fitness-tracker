# Loadnote v3.33.0 — Explainable competition-lift recommendations

## What's new
- In **Coach → Decisions**, expand an individual squat, bench or deadlift and open **Why this recommendation?** to inspect the decision returned by the existing deterministic engine.
- See up to three qualified competition-lift exposures, their source dates, logged loads, reps, RPE, estimated capacity, overall percentage trend, per-interval direction, mean/latest RPE and evidence freshness where valid.
- Inspect the engine's *existing* increase/reduce/hold gates and conservative-block thresholds, in a collapsed **Decision thresholds** section. All displayed weights convert from internal kg only at presentation.
- Ask the offline Coach a question such as **Why is my bench on hold?** or **Why did Loadnote recommend increasing my squat?** The Coach retrieves the current corrected decision, gives a factual answer, and never makes a chat-based program change.
- Historical views honor their selected date/mode; they do not present later workout observations as historical evidence.

## Limits
- This is **decision transparency**, not automatic prescription edits, a new AI training engine, a tested 1RM or a physiological readiness assessment. Actual program changes still require the existing review/approval controls.
- When three valid capacity observations are unavailable, missing RPE is not silently filled and no percentage trend or decision thresholds are presented as if the exercise had full evidence.
- Medical boundaries continue to precede the explanation handler. No training records, weight units, workout intents or persisted schema (32) changed.
- The model never treats its past chat answers as logged evidence. An explicit lift direction request is answered deterministically even when optional local AI is selected.

## Testing
- `tests/decision-explanation.test.js` covers increase, hold and reduce outputs; source evidence; kg/lb; unsatisfied readiness; future-workout exclusion; safe questions; no training writes.
- Browser coverage checks the expanded decision detail and Coach explanation without changing workout state.
- Validate the full Node, browser Chromium/WebKit, Android, iOS and packaging CI before merge; physical mobile acceptance remains necessary.
