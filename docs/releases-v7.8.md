# Loadnote v7.8.0 — Exercise graphs and goal journeys

Version 7.8.0 · unsigned native build 39800 · schema 34.

Progress now offers a picker for any saved exercise and tracking mode. Exercise details default to a bar graph with a line option, date ranges, and readable graph values. Strength metrics include logged load, estimated 1RM and reps; timed holds use seconds; cardio uses minutes or distance in km (miles converted). Each point is the highest logged value on that day. Separate exercise identities and tracking modes remain separate.

Progress also displays active strength and cumulative workout goals with explicit start/current/finish values. Existing Coach goal creation is reused. Strength targets use estimated 1RM, with an initial best estimate captured at creation or an athlete-entered baseline. Sessions build a separate cumulative workout target; merely attending does not claim increased strength. Saved PRs and logged sets contribute relevant strength evidence. Future dates, drafts, empty workouts and explicitly unfinished sets do not count. Editing/deleting saved records recalculates progress. Target percentages are capped at 100%; goals are still marked complete by the athlete.

Compatibility: existing goals and training history stay intact. New optional fields on simple goals (`startDate`, `startWeight`, `exerciseId`, `targetSessions`) require no migration or collection replacement. Older strength goals without a captured baseline show their evidence and target without inventing a starting percentage. Weekly athlete-goal planning and deterministic adaptation engines are unchanged. No online/model dependency.

Architecture: pure goal evidence logic lives in `goal-progress.js`, rendering in `goal-progress-ui.js`; exercise chart aggregation extends the existing progress model. New scripts are included in the offline asset manifest. No performance or goal-progress snapshots are written by rendering.

Rollback baseline: approved main `ef47af4517c9a9dce60c3a0b56ba47e64b2cdeca` (v7.7.1/build39701). Revert the release as a whole; retain user backups. Old releases preserve optional goal fields but cannot display the new cumulative goal type.

Validation: new Node business-logic tests cover exact identity, dates, duplicate-session counting, deletion, compatibility, distance conversion, tracking modes, RPE estimates and immutable history. New browser scenarios cover mode-specific bar/line values, cumulative persistence/recalculation, lb start/finish + PR progression, and narrow enlarged-text layout. Local browser launch is blocked by socket EPERM before app load; no local interaction pass is claimed. Complete Node/static/packaging and exact-head CI results are recorded in the PR/tracker before review. Physical-phone and disconnected-live acceptance remain separate outstanding checks.
