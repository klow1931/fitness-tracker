# Loadnote v0.3 — Training Intelligence

## Added
- Training Intelligence dashboard card.
- Training Status signal based on recent logged RPE, volume, and frequency.
- Strength trend summaries for recent exercises.
- Deterministic Next Workout recommendations from the latest completed sets.
- Normalized exercise intelligence database with aliases, muscle groups, movement patterns, and parent/variation relationships.
- Deterministic progression engine with conservative increase/hold/repeat rules.
- Core schema marker for training intelligence and v2 → v3 migration.
- Automated tests for exercise resolution and progression rules.

## Fixed
- Removed duplicate `let data` declaration introduced in the v0.2 foundation package.
- IndexedDB version advanced to 3 for the new schema marker.

## Preserved
- Existing workout, nutrition, PR, measurement, photo, form, program, and coach features.
- Existing local-first storage and JSON backup behavior.

## Next
- RPE-first workout UI.
- Full exercise database integration into workout entry/programming.
- Adaptive multi-session progression engine.
- AI Coach structured recommendations backed by deterministic analytics.
