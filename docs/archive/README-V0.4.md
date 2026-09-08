# Loadnote v0.4

This release upgrades the v0.3 Training Intelligence layer into session-level Adaptive Programming.

## Run locally
Open `index.html` in a modern browser for the current prototype. For tests:

```bash
npm test
npm run check
```

## Key files
- `src/training/adaptive.js` — deterministic adaptive session recommendations
- `src/training/analytics.js` — training analytics
- `src/training/exercises.js` — exercise relationships
- `src/training/progression.js` — simple set-level progression helper
- `src/core/loadnote-core.js` — state schema/migrations
- `app.js` — existing application UI and dashboard integration

## v0.4 recommendation logic
The adaptive engine evaluates the full latest exercise exposure rather than only the last set. It considers completion, target RPE, average/max RPE, recent trend, and high-fatigue status.

It intentionally does not claim medical readiness or use an LLM to calculate training loads.
