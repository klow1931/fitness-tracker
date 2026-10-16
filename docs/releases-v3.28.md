# Loadnote v3.28.0 — Offline conversational planning

Coach can gather a request over several turns, ask for missing requirements, and carry the reviewed settings into the existing program designer. Examples:

- “Create a 12-week powerlifting program, four days per week, 60 minutes, full gym, with bench priority.”
- “Create an upper-body workout today, 30 minutes, with dumbbells.”
- “Create a bench workout tomorrow, 45 minutes, with a barbell.”

Program drafts carry the requested weeks, days, time, loading style and supported priority. Training maxes, fresh loads, movement mappings, equipment and the generated weeks still need review. Saving and scheduling remain separate approvals. Profile/goal edits remain explicit; chat does not silently rewrite them.

Daily resistance-workout drafts suggest movements from the bundled reference using stated equipment, focus and confirmed exclusions. Dose fields are editable starting conveniences, not an inferred individual prescription. Loads are initially blank. The athlete reviews exact targets and confirms loading an unscheduled draft; actual effort and completion stay unknown. Existing logger/sport drafts cannot be silently replaced. Current Calendar plans are offered for review through the existing adaptation controller before drafting a separate workout.

Planning context is session-only and clears with the shared conversation. Saved preferences remain editable through existing Profile and Training preferences controls. No history is treated as proof of recovery or a substitute for a fresh starting load.

Supported chat paths in this release:

- Standalone strength: 5–13 weeks, 2–5 days/week; existing reviewed phase engine.
- Muscle growth: 1–24 weeks, 1–7 days/week; confirmed goals, mapped movements and existing workload checks.
- Daily resistance drafts: today/tomorrow, 10–240-minute planning budget, explicit fresh loads and load conventions. Estimates exclude warm-up, queues and interruptions; work exceeding the budget must be revised.
- Technical sport work and meet peaking retain their dedicated reviewed planners. Unsupported durations, excluded competition lifts and ambiguous loading styles are clarified instead of silently changed.

Reference retrieval expands a small curated set of concepts such as plateau, muscle gain, DUP and assistance work. This is concept-based matching, not embeddings, general-purpose reasoning, model retraining or new scientific evidence. Existing citations remain attached to educational summaries.

No schema migration. No new model download, external AI call, research access or background learning is introduced. Optional local-model upgrades and opt-in internet research remain separate future work.
