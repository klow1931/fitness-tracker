# History cleanup & coverage — v1.17

Workout History includes a collapsed cleanup panel. It uses current saved records through today; it is not historical as-recorded replay. No personal export is bundled with the app. No new stored schema or migration is needed.

## Heuristics, not corrections

The pure `LoadnoteCleanup.inspect(state,{asOf})` flags a narrow pattern: three adjacent rep-based sets within one exercise row, equal rep counts, positive finite loads, outer loads within 10%, middle load more than 40% lower than both neighbors. This is unit-invariant and may represent an intentional drop set. There is no automatic correction, error score, permanent dismissal or claim to detect every typo. Timed holds, cardio, zero loads and future workouts are excluded.

Possible aliases use normalized name tokens, excluding the generic token “machine,” with conservative qualifier checks. Similar names do not establish equivalent equipment, load conventions or movement. Only identities with recorded workouts appear. Side-by-side previews show the latest ten entries per identity, then a button stages the existing Tools merge selectors. The athlete can change the target, cancel or confirm there. Existing merge recovery snapshots preserve reversibility; original labels stay saved.

## Coverage and correction

Coverage shows each started block's date range through today, logged workout count, distinct recorded dates, first/last logged date and the athlete-entered completeness field. Empty dates are unknown, never failures. “Review block coverage” opens the revisioned block editor; all normal confirmation/persistence checks remain in force.

Entry flags and current-corrected review evidence open the existing workout editor. Draft overwrite confirmation, save review, revisions, PR reconciliation and undo are reused. Historical as-recorded evidence has no direct edit action; changes belong to current records in History. No save happens merely by opening an editor. Cleanup flags update when the history is rendered again.

## Observed singles

Training Review shows dated submaximal singles (one rep, positive load, RPE 1 to below 10) separately from capacity estimates. The table lists actual load and RPE in chronological order, including different effort levels without asserting equivalence. Comparisons do not generate strength-gain percentages or capacity estimates. The review's date, block and historical-mode filters still govern which evidence is visible. Values remain kg internally and convert for display.

## Verification

Synthetic tests cover the heuristic boundaries, name qualifiers, no-data and future-date handling, nonmutation/roundtrip, coverage, single observation ordering, editor routing, alias cancellation and failed coverage writes. Existing save/undo, merge/recovery and offline/update regressions remain required. Physical iPhone acceptance is separate from mobile-viewport Chromium tests.
