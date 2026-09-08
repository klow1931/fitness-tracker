# Loadnote v0.7 — Athlete Profile + Personalized Programming

v0.7 introduces an athlete profile and training-max layer. Programs can now be generated in the context of the athlete's goal, experience, schedule, current strength, and preferred programming style. Missing major-lift maxes can be inferred from logged training history.

## Core behavior
- Profile values are stored locally with existing workout data.
- Training maxes default to 90% of estimated 1RM and can be adjusted.
- Major lifts: squat, bench, deadlift, overhead press.
- A generated program stores an athlete-profile snapshot and training-max snapshot.
- Active programs display a deterministic block status: progress, maintain, or deload/reduce fatigue.
- Existing v0.1–v0.6 data migrates forward without replacing workout history.
