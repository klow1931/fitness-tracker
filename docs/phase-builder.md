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

## Flexible meet cycles (v2.30)

Save a reviewed phase proposal as lift setup, then select a configurable mock-meet cycle (7–52 weeks) in the same Programming area. Total duration includes the mock-meet week; two accumulation and two strength weeks are minimums. Peak (1–4) and taper (1–2) durations are athlete-selected. For extended base phases, the phase generator's last supported training-max target is held after week six, never extrapolated upward without review. The source phase proposal remains separate and is not automatically scheduled. Preview and explicitly save the full original, then explicitly schedule only if Calendar dates are conflict-free. The meet date is an event marker with no invented attempt load. Existing phase reviews do not apply automatically to these meet-cycle records; review future work independently while phase-aware reviews are developed.

## Phase-aware Decisions (v2.31)

Once a flexible meet cycle is explicitly scheduled, Decisions displays its current phase and week, the phase focus, next prescribed workout and end-of-week/phase review dates. Expand the evidence panel for the week’s original per-lift prescription and reliably linked logged work. RPE-cap comparisons are offered only where the approved plan was recorded before training and the original sets, exercise identity, load and reps match. Unlogged workouts remain unconfirmed; explicit skips and cancelled sessions are distinct. Later imports and edits cannot rewrite historical evidence. This version does not revise future sessions or substitute for athlete approval.

## Athlete-approved weekly and phase-transition reviews (v2.32)

The Decisions current-cycle card offers completed-week reviews. Existing weekly evidence remains descriptive; only directly comparable logged load, reps, exercise identity and RPE can justify the optional one-set-per-exposure reduction on the next week's original prescription. All reviewed sessions must have a resolved status and all intended next-week exposures must be untouched, scheduled, still in the future, and have at least three working sets. A lift requires at least two logged RPE-cap exceedances on directly comparable sets. Keep is always the default, with no schedule revisions. Original cycle weeks, load targets, training maxes, phase boundaries, workouts, peak/taper and mock-meet attempts are not automatically changed. A completed final week of a phase is labeled a phase-transition review; the bounded action still touches the next week only. Review snapshots are stored on the meet-cycle record in optional `weeklyReviews` metadata; no new schema migration is required, so previously saved cycles remain valid.

## Descriptive cycle training response (v2.33)

Decisions shows training-response histories for **completed weeks**, grouped by phase, for each confirmed competition lift. It separates original prescribed sets/exposures, verified linked sets/exposures and directly comparable original RPE caps. A within-phase capacity direction appears only after at least four dated, eligible competition-lift capacity estimates spanning 14 days; estimates follow the existing `Core.capacityEvidence` policy and compare the median of the first two versus last two eligible dates. Missing logs are unconfirmed, and variation, late import and unverified Calendar revisions are excluded from capacity comparisons. This is a read-only association, not an optimized volume inference, readiness diagnosis or causal explanation. All existing weekly review and athlete-approval rules remain unchanged.
