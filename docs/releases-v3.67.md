# Loadnote v3.67.0 — Offline Program Check & Complete Studio Review

## What changed

- **Custom Program Studio** now provides a complete, expandable preview of **every** week and session before an athlete confirms the import. The previous first-five-session preview was not sufficient for reviewing large uploaded plans. The existing original-file comparison requirement remains; a preview is not a guarantee that PDF extraction was correct.
- **Program editing** adds a duplicate-exercise action and jump-to-week navigation. Revisions still create separate reviewed copies and preserve the original, Calendar history, local draft recovery and Undo.
- **Offline program check** offers a read-only summary of session days and weekly set counts; reports missing load/RPE targets; compares scheduled weekdays with confirmed training availability and selected movements with explicitly avoided exercises. No unknown load, exercise substitution or training recommendation is silently supplied. Strength-set counts describe prescriptions, not optimal programming volume.
- **Coach conversation** recognizes focused questions about *my uploaded/custom program* and *what you learned from my program edits*. It explains the reviewed plan, linked workout comparisons and saved edit reasons **only if the athlete opted to share those reasons**. Private reasons never appear in this route, including their categories. The optional local device-model summary receives a bounded version of the program check and retains the existing reason-sharing boundary.
- **Navigation** takes an athlete from a Coach program-check answer directly to Custom Program Studio. The Studio check works without a generated or scheduled program and without an internet connection once the app shell is installed.

## Trust boundaries

No automatic program mutations, invented training maxes, unsupervised AI learning, retraining, network upload or database-schema migration. The review does not estimate injuries, medical clearance, optimal dose, or causal benefits of athlete edits. It uses only confirmed profile settings, dated reviewed program revisions, and Calendar-linked workouts. Program outcomes without matching recorded sessions remain unknown. Saved workouts, photos, and backups are not rewritten.

Schema stays **33**; native build number **33420**. Exercise editing is available in the browser and native package after app update; on an existing iPhone Home Screen install, use the explicit safe-update flow introduced in v3.66 and confirm updated offline coverage. CI browser tests do not replace real-device exercise-row editing, backup verification and interruption testing.
