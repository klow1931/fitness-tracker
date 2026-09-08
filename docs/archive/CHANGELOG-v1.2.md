# Loadnote v1.2.0 — Workout Logger

## Changes
- Restored the workout screen, history, and templates accidentally removed from the v1.1.1 HTML. Restored existing Calendar, PRs, Photos, and Nutrition screens still referenced by navigation. Form Review and developer/API controls remain removed.
- Added automatic on-device draft saving and recovery, including incomplete fields, set checkmarks, date, notes, and program linkage.
- Added numbered, touch-friendly set rows. Add Set repeats the previous load and reps/hold time, leaving RPE and completion blank.
- Validate names, whole-number reps, nonnegative loads, hold time, cardio values, and RPE 1–10 before saving. Blank strength loads remain bodyweight (zero).
- Confirm replacing a current draft with a program, repeat, or template. Clear also clears pending program linkage.
- Convert in-progress loads when switching kg/lb. Fixed double conversion when loading programmed weights.
- Rest timer uses a deadline, so background throttling does not stretch the countdown. Notifications still depend on the browser running.
- Await durable workout saving before clearing the draft; prevent double saves and restore in-memory state if persistence fails.
- Added the logger module under src/product and included all local JavaScript modules in the service-worker cache.

