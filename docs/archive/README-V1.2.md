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

## Compatibility and limits
Existing history schema and storage keys are unchanged. Checkmarks are a session checklist: all valid entered sets are saved, checked or unchecked. Drafts are local to the browser/device and are separate from history exports. No cloud synchronization was added. Third-party CDN dependencies remain; complete offline operation is not claimed.

## Validation
All 11 Node test files pass, including new numeric validation and save-path integration tests covering duplicate save suppression, program metadata, PR updates, and storage-failure recovery. All production JavaScript passes Node syntax checks. HTML IDs are unique and the linked navigation panels exist.
Browser/mobile end-to-end and visual checks could not run: Chromium was absent and its download timed out. This package needs the manual checks below before public release.

## Manual acceptance checklist
1. Open through a local server (`python -m http.server 8000`) and select Workouts.
2. Enter a lift, 5 reps, 100 kg and RPE 8. Check the set, add a second set, and verify copied values with blank RPE.
3. Refresh: verify date, notes, sets, and checkmarks recover. Repeat with cardio and timed holds.
4. Switch kg to lb and back; 100 kg should show about 220.46 lb and return to 100 kg.
5. Try RPE 11, fractional reps, negative load, a missing exercise name, and a load without reps. Saving must be blocked.
6. Save a valid workout twice quickly. Verify one history record and no recovered draft after refresh.
7. Load a program session, refresh, save, and verify program progress. Clear a program draft before logging a standalone workout; it must not count toward the program.
8. Decline replacing a draft with a repeat/template/program; verify the original remains intact.
9. Run the rest timer, background the app, and return after its deadline; it should finish on the next browser tick.
10. Check logger width at 390px and desktop widths, with Gym mode on/off and dark mode. Verify navigation, history, templates, and JSON export/import.

Run automated checks with `npm test` and `npm run check`; tests require no downloaded packages.
