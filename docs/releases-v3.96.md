# Loadnote v3.96.0 — Repeat Your Last Workout (First-Week Handoff)

## Objective
Make the transition from a beginner's first completed workout to the next session intuitive. Instead of navigating through History and copying sets manually, a returning user with a previous verified unscheduled workout can tap **Repeat last workout** in the existing Your first week card.

## Exact behavior
This action uses the same logged-workout repetition infrastructure as Train. It selects the most recent eligible actual workout as of the current local date by saved identity; old sets and loads become **editable starting points**, not automatically completed work. RPE and done checkmarks remain unset until the athlete logs current performance. The resulting unfinished draft uses existing device-local draft recovery. A historical workout is created only through the normal explicit Review / Save process.

The card also offers **Start a different workout** and the earlier **See previous workout** route. Nothing is automatically scheduled, progressed, or prescribed. Existing unfinished drafts, upcoming Calendar sessions, conflicting/review-required days and active workouts continue to take precedence over a repeat suggestion.

No repeat button is shown if an actual prior session is unavailable, lacks an ID, contains sport practice outside the strength logger, or occurs on/future of the current date. Missing RPE is not inferred, raw historical weights are passed through the existing unit-conversion UI, and the original completed workout stays immutable.

## Quality gate
Update unit and real-browser tests for exact source selection, planned/future exclusions, draft recovery after reload, original workout integrity, no automatic set completion, and scheduling/draft priority. Complete Node/static, security, Chromium browser shards, iPhone WebKit, Android/iOS native builds and installed offline device acceptance before merging.

Release **v3.96.0**, unsigned native beta **35600**, data schema **34** unchanged. Preserve v3.95 on `main` as the rollback.
