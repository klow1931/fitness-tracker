# Loadnote v7.5.0 — Clearer rest and return to entry

Version 7.5.0 · unsigned native build 39500 · schema 34 unchanged. The user requested v7.5 from merged v7.3; there is no implied v7.4 release.

The workout cockpit shows remaining rest as minutes:seconds, rounded up to the next second. The paused state stays explicit. Existing timer snapshots and their seconds labels remain compatible with other consumers; the deadline, persistence, pause, extension and completion-Undo implementation is unchanged. The visible clock updates only when the displayed value changes and does not announce each tick.

During rest, Back to set stops the timer and focuses the current unfinished load. Cardio offers Back to exercise and focuses duration. Completed work has no return action. Eligibility is rechecked at activation; no set is completed, load filled, prescription changed, session started or workout saved by this action. A collapsed destination is expanded through its existing control. Automatic rest transitions still keep the numeric keyboard closed; only explicit return requests entry focus.

The pure restDisplay projection lives in training-execution.js, and interaction remains in the existing cockpit UI. No schema migration, stored workout change, unit convention or programming policy change is required.

Rollback baseline: merged v7.3 commit d9ef558f171a49e91fd54692ac25833580face32. The release stays isolated until checks complete and the user merges it.

Validation covers display boundaries and nonmutation, rest/pause/extension, controls retaining focus, return without performance mutation, pounds, reload recovery, completed work, timed strength and narrow enlarged text. Existing Node/static/mobile/native/beta, full Chromium/WebKit, native compilation, Android offline emulator and CodeQL checks remain release gates.

Native builds remain unsigned and local-only. Physical iPhone/Android keyboard, installation, screen-reader and low-storage acceptance remain outstanding; programmatic browser focus does not prove a physical keyboard opens correctly.
