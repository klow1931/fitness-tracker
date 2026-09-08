# Loadnote v0.8

## Adaptive Mesocycle Engine

v0.8 turns personalized programming into a week-to-week system instead of a static generated routine.

### What changed
- 4-week default mesocycle state per program.
- Current week advances from completed program sessions.
- Main lifts use athlete Training Maxes when available.
- Weekly intensity rises gradually during a normal block.
- Completion and RPE can trigger Progress, Maintain, or Deload decisions.
- Deload weeks reduce sets and intensity.
- Every program workout stores its week/block/decision metadata.
- The Active Program card explains why the current decision was made.

### Data safety
Schema v8 is backwards compatible with v0.7. Existing workouts and programs are preserved.

### Testing
Run `npm test` and `npm run check`.
