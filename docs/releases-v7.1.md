# Loadnote v7.1.0 — Simpler first workouts

Version 7.1.0 · unsigned native build 39100 · training schema 34 unchanged.

## Behavior

Starter-plan availability now accepts an explicit training-day timezone offset. Browser UI computes that offset at the end of the selected local day, accounting for DST, and shares it with saved-plan selection, Home and offline Coach. Default model callers retain UTC historical cutoffs. Future records, superseded versions and scheduled-plan restrictions remain bounded by the same cutoff. No timestamp is rewritten.

Guided Simple users in their first three logged workouts, without an established programming profile or advanced program, see compact Progress and Coach entry points. Full view restores the existing analytics. More training tools reveals the existing Coach workspace. Three actual saved workouts graduate this presentation automatically; future/invalid dates do not count. This presentation does not estimate experience or change training.

First-session exercise settings are grouped behind Exercise options. Original nodes and event handlers remain intact. Complete set delegates to existing validation, unit conversion, completion and Undo; typed RPE is preserved and blank RPE remains unknown. Existing full-view completion controls are preserved. Optional timing is not offered after all work is checked complete.

Early unlinked workout recaps lead with a short saved confirmation. Detailed evidence remains expandable. Linked session comparisons and lifecycle review requirements retain their prior presentation. Explicit RPE education no longer loses priority merely because a question says the athlete is new.

## Architecture and rollback

`beginner-training-ui.js` owns compact Progress/Coach presentation. Pure eligibility and summary selection live in `beginner-experience.js`. Starter date cutoffs remain in `beginner-program.js`; browser date options are passed explicitly rather than reading a clock inside the model. Existing session serialization and training engines remain authoritative. No migration or data shape change.

Rollback baseline: merged v7.0 commit `82f2c57cd85d15a3bc02aaa4badbfa6259a99d7d`. This release is prepared on a separate branch; main remains unchanged until approved and merged.

## Validation

New Node tests cover UTC/local evening boundaries, positive and negative timezone offsets, summer offsets, invalid offsets, future exclusion, immutable plan selection, shared Coach access, direct RPE questions and early-presentation eligibility. Browser tests cover actual saved-plan reopening/reload/load, successful logging with optional effort, pounds conversion, compact recap/Progress, reversible full tools and narrow enlarged-text layout. The complete existing Node/static/mobile/native-source/beta checks and browser suite remain release gates.

Physical iPhone/Android keyboard, native navigation, signing and installation acceptance remain required. Native builds are unsigned and local-only; browser emulation does not establish physical-device acceptance. Offline file-repair failure from the review has not been attributed to a root cause by this release.
