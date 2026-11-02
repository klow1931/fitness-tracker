# Loadnote v6.1.0 — Last saved exercise context while training

**Version:** 6.1.0 · **unsigned mobile build:** 38100 · **training schema:** 34 unchanged.

v6.1 gives the built-in offline Coach a trustworthy answer to **“How did I do last time?”** while a strength workout is open. This is a direct continuation of the v6.0 between-set review and uses the *existing* corrected exercise-history engine.

## What an athlete sees

- During a workout, ask **“How did I do last time?”**, **“What did I lift last time?”** or **“Compare this exercise to last time.”** The current logger exercise is used only when its name or alias maps to **exactly one** registered exercise.
- Coach shows up to four working sets from the most recent saved session **before the open workout date**, including load in selected display units, reps, reported RPE and saved completion certainty.
- If the last checked draft set is for the same exercise, Coach labels its entered load, reps and RPE separately as **unsaved draft**. No inferred trends or unapproved load advice.
- Ambiguous names, unregistered exercises, stale draft dates and missing history receive useful explanations without invented data.
- The existing **Return to workout** action sends users straight back to Train.

## Technical boundaries

- New, focused `src/product/coach-live-history.js`, calling the current `LoadnoteCoachTrainingHistory.inspect` on one exact exercise identity with a previous-day cutoff.
- User-authored saved corrections remain authoritative. Legacy name-only sets are used only when aliases are not ambiguous. Missing RPE and completion markers remain unknown.
- The new readout is not overridden by experimental device-model prose.
- No new storage keys, new workouts, changed loads, training-history migrations, automatic program changes, or server-side API keys. No medical or recovery determination.
- Uses offline PWA cache with version bump; native build labels aligned with version.

## Validation

- `npm run check` and `npm test` including `tests/v61-live-history.test.js`
- `tests/browser/v61-live-history.spec.js` in both desktop/mobile Chromium and iPhone WebKit; a Node check guards WebKit project selection.
- Full workout logger, progress, Decisions, restoration, data and native builds through CI.
- **Real device gate:** verify saved set comparison in kg and lb, current draft vs saved separation, edited training history, offline Home Screen, quick return to Train, no workout mutation.

**Rollback:** merged and verified v6.0.0. Keep this PR draft until all automated and device acceptance gates pass.
