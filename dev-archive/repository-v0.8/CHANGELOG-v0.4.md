# Loadnote v0.4 — Adaptive Programming

## Added
- Session-level adaptive progression engine.
- Recommendations based on completed sets, average/max RPE, target sets/reps, recent strength trend, and training status.
- Increase / hold / reduce / repeat actions with explanations and confidence.
- Dashboard now uses adaptive recommendations instead of last-set-only progression.
- Added v4 schema marker and migration.
- Added automated adaptive-programming regression tests.

## Safety/design choices
- Programming calculations remain deterministic; AI is not used to decide loads.
- Incomplete prescribed work does not trigger automatic increases.
- High fatigue can trigger a conservative reduction.
- Missing RPE does not create false precision.
