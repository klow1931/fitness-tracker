# Loadnote v7.6.0 — Continue a workout

Version 7.6.0 · unsigned native build 39600 · schema 34 unchanged.

When all entered work is checked complete, the cockpit keeps Finish prominent and offers a secondary continuation section. Add blank set names the last strength exercise and creates an unchecked row with blank reps/duration, load and actual RPE. If the final exercise is cardio, only Add exercise is offered. Add exercise creates a blank strength row, opens the existing options and focuses name entry.

Eligibility is rechecked at activation. Review, saving, hidden logger, an unfinished set or an unnamed row blocks the shortcut. This also prevents rapid repeated activation from adding several blank rows. These actions use the existing form builders, draft checkpoint, training-flow refresh and serializer. The explicit add action requests entry focus while retaining the rest deadline; automatic completion still keeps the keyboard closed during rest.

Existing sets, captured prescriptions, workout history and training policy stay unchanged. An untouched blank set is draft structure rather than performed work and is excluded by the existing serializer. Extra actual work still passes through normal validation, completion, review and save. No migration, unit convention or adaptive-programming change is introduced.

workout-continuation-ui.js owns this small presentation boundary; the cockpit calls it after normal rendering. No business logic is moved into the app monolith.

Rollback baseline: merged v7.5 commit a1115f974711fb7993e60e1d20da214b34426a8f. This release stays isolated until validated and merged by the user.

Validation covers blank set creation, preservation of prior performance/rest, stale/double action guards, reload and save exclusion, real lb/kg entry, another exercise, timed strength, captured-plan nonmutation, cardio, review/saving gates and narrow enlarged-text keyboard use. Existing Node/static/mobile/native/beta, full Chromium/WebKit, native compilation, Android offline emulator and CodeQL checks remain release gates.

Native builds remain unsigned and local-only. Physical-phone keyboard, screen-reader, installation and low-storage acceptance remain outstanding.
