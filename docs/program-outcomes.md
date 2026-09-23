# Program adjustment outcomes (v2.12)

**Decisions → Programs → After your adjustments** is a read-only follow-up to accepted builder-program week reviews. Each review is collapsed by default. Expand a lift to inspect its original program, plan at approval, recorded work, deviation notes and observed result.

## What is measured

The report follows only the next program calendar week, not an unbounded search for a favorable result. Squat, bench and deadlift use the stable exercise IDs in the accepted review. Keep and Reduce choices are labeled separately. A saved workout is not automatically evidence that the approved plan was followed.

- **Followed work:** matching exercise identity, set count, reps and load (within 0.02 kg), with the approved prescription and known before-training timing. Missing RPE does not erase completion evidence.
- **Comparable session:** all the above plus RPE 6–10 and a recorded cap for every planned set. Partial sessions are not pooled into a complete session.
- **Within cap:** every matched set's actual RPE is at or below its prescribed cap. Any overshoot counts as above cap. This differs from the v2.11 adjustment trigger, which requires at least 1 RPE above cap on repeated sessions; the UI explains the difference.
- **Week summary:** requires complete comparable coverage of that lift's target sessions on at least two distinct training dates. Otherwise show Not enough comparable data, while still showing individual observations and denominators. This is a product coverage guard, not a statistical confidence threshold.

Skipped, cancelled, upcoming, unconfirmed, outside-window, substituted, changed-load, changed-rep, changed-set and missing-RPE sessions retain explicit labels. Multiple linked workouts, changed competition mappings, uncertain timing, and later linked plan revisions cannot establish a comparable outcome. An already-attributed lift/workout is not counted again if conflicting review records exist; chronological first attribution wins deterministically.

## Recovery and interpretation

Show recovery recorded at approval and, if available by the cutoff, the following week's accepted-review check-in. These are separate retrospective check-ins, not daily measurements. Missing follow-up recovery stays Not recorded.

Within-cap follow-ups are observations, not proof that the adjustment caused improvement or that a strategy works long-term. Prescribed load changes are never labeled strength gains. This release adds no physiological-strength percentage, personalized dose estimate, automatic learning, recommendation, or training-plan mutation.

## Chronology and storage

The analysis date bounds workout dates. The knowledge cutoff is the earliest of that day's end, the supplied knowledge timestamp, and current time. Workout revision replay excludes later edits; reviews and schedule revisions must exist by the relevant cutoff. Future recovery reviews are not visible in earlier reports. Competition identity is checked using role history available at the workout's recorded timestamp.

The original program and existing approval/schedule records supply the timeline. Existing backups without program reviews show an empty state. Missing program context is explicitly unavailable. The report is derived: schema remains 19, no migration or extra stored outcome records are needed. Full JSON backups preserve its source records. Unit conversion is display-only; stored kg values remain unchanged.

Tests cover per-lift coverage, same-day sparsity, missing RPE, changed work, duplicate attribution, later plans, mapping changes, retrospective/future data exclusion, revision replay, recovery cutoff, nonmutation and JSON round trips. Browser checks cover compact details, date filtering, mobile layout, dark mode, lb display and offline reload. Physical iPhone testing remains separate.
