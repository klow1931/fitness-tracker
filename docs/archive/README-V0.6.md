# Loadnote v0.6 — Adaptive Programs 2.0

v0.6 connects saved programs to logged performance. The app now previews the next program day, derives a target load from the latest matching exercise history, applies the deterministic v0.4 adaptive rules, and loads the adaptive session into the workout logger.

## Key behavior
- Active programs have a next-session preview.
- Program workouts are tagged with `programId`, `programDayIndex`, and `programDayName` when started from a program.
- The next program day advances from the most recently completed tagged session.
- Existing workout history remains compatible.
- Recommendations remain deterministic; AI is explanatory rather than the source of load calculations.
