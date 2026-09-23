# Program review and adjustment proposals (v2.11)

Decisions → Programs → Review a completed program week compares a scheduled builder program with recorded work. This first feedback loop supports weeks 1–3 of the existing four-week builder. It does not generate arbitrary programs or tune the training decision engine.

Each competition lift receives an independent, explainable finding. Exercise IDs and confirmed competition mappings matter; display names do not substitute for mappings. The original schedule, the prescription linked to each workout, actual sets and deviation notes are shown separately. Recovery is an optional check-in, not a diagnosis or readiness score.

## Policy: matched-effort-v1

- Compare only uniquely linked workouts in that calendar week, with known recording timestamps and a matching, before-training prescription. Missing sessions, ambiguous links, changed reps/loads, absent or out-of-range RPE, and changed competition mappings withhold adjustment.
- Actual load must match the linked plan within 0.02 kg, reps and set counts must match, and RPE must be 6–10. Existing core RPE-aware capacity calculations are reused as evidence, not treated as measured 1RMs.
- Two matched sessions with sets at least one RPE point above their caps permit a proposed 5% reduction. This is an explicit product heuristic, not a validated individualized training dose. Rounding down to the configured increment may yield a larger percentage change; the exact loads are displayed before approval.
- An isolated effort overshoot or worse recovery requests more evidence/manual review. Unknown or reported discomfort also withholds adjustment. Unknown sleep/fatigue/soreness do not invent a recovery assessment.
- Hold/Keep means retaining the existing next-week plan, including progression already in that plan. It does not mean an increase was earned. Gather is not clearance to progress. There are no automatically proposed increases.
- Week 3 protects the planned week-4 deload from this rule.

## Approval and chronology

Only future, scheduled, uncompleted sessions in the next program week are eligible. Today/past dates, cancelled or missing sessions, completed targets and open target workout drafts are protected. Before applying, the model rebuilds the report; changes to relevant evidence or schedules invalidate the preview. Each program/week can have one accepted review, preventing repeated reductions from the same evidence.

Approval appends schedule revisions with the actual capture time, preserves original schedule revisions, and never rewrites reviewed programs or workouts. Saving fails without adopting the new in-memory state if persistence fails. Review records retain evidence, recovery, per-lift choices and before/after schedule revisions. An all-Keep approval records a review without changing the schedule.

Analysis uses workouts and role/schedule revisions available at the review cutoff. Future workouts are excluded from performance evidence. The full current history is used only to protect already-completed future targets from editing. Recovery check-ins describe the present review; these records are not retrospective coaching recommendations.

## Storage and limits

Schema 19 adds `programReviews: []` for existing users. JSON backups, recovery snapshots and imports preserve the collection; malformed records are rejected. CSV remains a workout/nutrition export, not a full backup. Loads remain kg internally and follow the existing display-unit setting.

This release does not alter engine thresholds, infer physiological gains from prescribed load increases, learn a personalized dose-response curve, or replace a coach's judgment. Historical workouts lacking prospective plan evidence remain useful history, but do not qualify for this adjustment rule.

Automated coverage includes approval, sparse evidence, stale previews, repeated approval, draft protection, storage failure, preservation of originals, migration, backup round trips, mobile layout and offline reload. Physical-device checks remain separate from browser emulation.
