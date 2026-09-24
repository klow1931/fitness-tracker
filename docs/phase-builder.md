# Phase-based program builder (v2.14)

**Decisions → Programs → Phase-based program builder** adds a separate, reviewed sequence alongside the unchanged four-week builder. It supports accumulation (2–6 weeks), strength (2–6 weeks) and one deload week: 5–13 weeks total, always in that order. Phase lengths are editable; arbitrary phase ordering and meet peaks are not supported.

## Lift-specific structure

Choose 2–5 training days within the programming profile. Each lift gets exactly one primary competition exposure and up to two light or athlete-selected variation exposures on distinct days. Frequencies can differ between lifts. All selected days must contain work. Each exposure supports straight sets or a top set followed by back-offs. Each lift has its own working-set count (2–4) and within-phase progression step (0–2.5 percentage points of training max per week).

Variations must have a confirmed close-variation mapping to that lift, an explicit separate training max and confirmed equipment access. Competition training maxes are never reused automatically for variations. Preferred exercises are labeled but not silently inserted; avoided exercises are blocked. Purpose labels describe competition practice, lower-load practice or athlete-selected variation—not diagnosed weaknesses.

## Transparent generation rules

- Accumulation begins at 65% of the selected exercise's training max for sets of 5, RPE cap 7.
- Strength begins at 75%, with straight/top sets of 3 at cap 8. Top-set format uses 5-rep back-offs.
- Weekly percentage-point steps restart within each loading phase. A proposal exceeding 85% TM is rejected; values are not silently clipped.
- Light exposures subtract 7.5 percentage points and one RPE point during loading phases. Back-off sets subtract another 7.5 percentage points and one RPE point from their exposure's top set.
- Deload uses 60% TM (light exposures 52.5%), 3 reps, cap 6 and half the working sets rounded up. It uses straight sets regardless of the loading-phase format.
- Loads are rounded down to the selected total-bar increment and stored in kg. No training max, goal target or prescribed load is equated with physiological capacity.

These are bounded, reviewable **product heuristics**, not evidence that these doses are optimal for an individual. All phases require athlete review; proposed increases are not automatically earned.

## Quality checks

Block generation when days, equipment, avoided exercises, identity mappings, progression ceilings or available time conflict. The time estimate uses 15 minutes preparation, 6 minutes per working set and 5 minutes per exercise transition; it is not a duration guarantee.

Flag adjacent-day exposures and any week-to-week prescribed tonnage increase above 20%. If at least three recorded training dates span 14 days within the last 28 days, compare first-week set counts with the recorded four-week average and flag increases over 25%. Otherwise say there is not enough dated history for that comparison. Logs may be incomplete; these are review prompts, not physiological safety thresholds, capacity estimates or fatigue scores. Historical workout revisions and known-at timestamps are respected; future workouts and unknown capture times do not supply the recent-history comparison.

An active programming profile is required. Return/re-entry goals or returning consistency should use the existing return/base builder. Dedicated hypertrophy and meet-preparation goals remain unsupported. A recorded meet date must be later than the full sequence plus a one-week buffer; that buffer is a product exclusion rule, not a taper prescription. User-reported experience and priorities do not silently change the dose.

## Approval, data and compatibility

Generate → inspect warnings and every week → explicitly approve/save → separately schedule. Editing inputs invalidates the preview. Saving checks current profile, roles and the generated quality report. Scheduling rejects stale context, dates in the past, duplicate scheduling and Calendar conflicts. Failed storage does not adopt the candidate state.

Schema 21 adds `phasePrograms: []`; each record preserves configuration, exact generated sessions, profile/role snapshots, quality warnings, review timestamp/notes and scheduling timestamp. Import validates the generated sessions against configuration and validates snapshot chronology. JSON backups and recovery snapshots include the records; old backups migrate to an empty collection. Routine CSV is not a full backup.

Calendar entries use separate `phase:` IDs and captured prescriptions. Deload sessions carry the existing deload role. Original workouts, drafts, programs, PRs, training blocks and kg-based performance analytics are not rewritten. Phase metadata lives in the program; it does not create or overwrite Training Block records automatically.

**The existing four-week review and adjustment rules do not apply to these longer sequences.** Their selectors continue to use legacy reviewed programs only. Review phase progression manually using Calendar and training history. This release does not expand automatic adaptation, infer strength gains, or claim coach-validated programming quality.

Tests cover phase durations, per-lift exposure counts, formats, variation-specific maxes, profile and calendar conflicts, sparse/future data, snapshots, stale previews, kg/lb, imports/migrations, save failures, offline reload, drafts and mobile layout. Physical iPhone and prospective coach/athlete validation remain separate.
