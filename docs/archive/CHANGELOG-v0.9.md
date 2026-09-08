# Loadnote v0.9 — Performance & Fatigue Engine

## Added
- `src/training/fatigue.js` deterministic performance/fatigue analysis engine.
- 0–100 training-status score with transparent component signals.
- Acute-vs-chronic volume comparison using 7-day volume and 28-day weekly average.
- 14-day RPE signal.
- Recent performance direction based on exercise e1RM trends.
- 28-day adherence estimate using athlete-profile training frequency.
- Training-stress flags for load spikes, high RPE, performance decline, and low adherence.
- Dashboard fatigue score and supporting details.
- Schema version 9 migration metadata.
- Automated fatigue-engine tests.

## Changed
- Dashboard Training Status now uses the fatigue engine when available while retaining the existing analytics fallback.
- Package version updated to 0.9.0.

## Safety/product note
The score is a training-planning signal, not a medical or physiological measurement. It should not be presented as a diagnosis or exact recovery percentage.
