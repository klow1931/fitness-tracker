# v2.10 — Reviewed powerlifting program builder

## Scope and use

Decisions → Powerlifting program builder. This is a bounded four-week template pilot, not validated individualized coaching. Choose a 3-day return/base structure or 4-day strength structure, a Monday start, training days, 2–4 sets per exercise, explicit training maxes and a total-bar increment. Review every week, record athlete review or a user-reported coach review, and save. Coach identity is not verified. Scheduling is a separate confirmation. Existing programs, active program, workouts and logger drafts are not rewritten.

Only confirmed competition exercise IDs are used. No substring matching or inferred substitutions. Goal sport must be Powerlifting; available days and session time constrain the proposal. Narrative experience/equipment are shown for human review, not treated as validated programming rules. Standard barbell/rack/bench/plate access is explicitly confirmed. Event dates on/before start + 34 days are rejected: this builder does not create a meet taper or attempt plan. A later event date is context, not evidence that a single block prepares someone for that event.

## Transparent template policy v1

- Return/base: squat+bench, deadlift+bench, squat+bench. Proposed weekly percentages of athlete-entered training max: 65, 67.5, 70, 60. RPE caps: 6, 6.5, 7, 6.
- Strength: squat+lighter deadlift, bench, deadlift+lighter squat, bench. Percentages: 70, 72.5, 75, 60. RPE caps: 7, 7.5, 8, 6. Lighter exposures subtract five percentage points and 0.5 RPE in weeks 1–3.
- Weeks 1–2 use five reps, week 3 three reps. Week 4 uses three reps and half the chosen sets, rounded up. No accessories are automatically added.
- Round load down to the selected increment, then store kg to two decimals. RPE is an effort cap, not a predicted response. Reduce/defer load and review if actual effort or technique differs. Proposed later weeks are not automatic earned progression.
- Rough session budget: 15 minutes plus five minutes per working set. This is a planning heuristic, not a physiological estimate; reject proposals exceeding the entered budget. Adjacent training days are flagged, including across weekly boundaries.

These exact numbers and thresholds are conservative product design defaults for review, not a protocol proven by a cited trial. They require experienced-coach review and prospective athlete validation before being described as optimized programming.

Background: ACSM's 2026 overview emphasizes individualization and distinguishes athlete needs from general healthy-adult guidance (https://acsm.org/resistance-training-guidelines-update-2026/). RPE-based volume regulation has been investigated in powerlifters (https://pubmed.ncbi.nlm.nih.gov/29786623/); this does not validate this implementation or the fixed four-week policy. No efficacy, injury-prevention or top-tier coaching claims are made.

## Persistence and chronology

Schema 18 adds `reviewedPrograms`. Records contain a versioned config, immutable generated sessions, review timestamp, optional goal snapshot and scheduling timestamp. Import/load validates constraints, chronology and exact agreement between policy-v1 configuration and sessions. Future policy changes must retain a v1 interpreter or migrate explicitly; never silently regenerate an old saved program with a new policy. Legacy backups receive an empty collection. Standard backups and recovery snapshots preserve records.

Revalidate goal/mappings before save and scheduling. Changed context requires a new preview/review. Reject expired start dates, duplicate scheduling and calendar date conflicts. Scheduling creates ordinary immutable schedule prescriptions with the actual scheduling timestamp and stable program/session IDs, then links them to the goal in the same persistence transaction. No historical knowledge is backdated. Goal links update through existing revision history. Calendar can reschedule/skip/cancel sessions; reviewed proposal remains the original audit record.

No dynamic adaptation or new live Decisions thresholds are introduced. The original legacy program generator is separate and unchanged. Physical iPhone Safari/PWA verification and actual coach/athlete validation are separate from automated browser tests.
