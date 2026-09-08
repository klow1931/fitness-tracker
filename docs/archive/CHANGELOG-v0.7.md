# Loadnote v0.7 — Athlete Profile + Personalized Programming

## Added
- Athlete profile with goal, experience, days/week, programming style, current strength, target date, and notes.
- Automatic inference of missing major-lift maxes from logged training history.
- Training Max (TM) calculation using a configurable percentage of estimated 1RM; 90% default.
- Major-lift mapping for squat, bench, deadlift, and overhead press.
- Active-program block status: progress, maintain, or deload/reduce fatigue.
- Program snapshots now store athlete profile and training-max context at generation time.
- Database schema v7 migration.

## Design rule
Deterministic calculations make the programming decision. AI can explain the decision but does not invent training-max math.
