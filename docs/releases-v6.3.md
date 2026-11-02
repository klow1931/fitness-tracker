# Loadnote v6.3.0 — One-tap in-workout Coach comparison

**Version:** 6.3.0 · **unsigned native build:** 38300 · **training schema:** 34 unchanged.

## In the gym

After checking a strength set in the current-day workout, **Compare checked set** appears in Train's execution cockpit. Tap it to open the existing built-in Coach and ask **Compare my checked set to last time**, without typing or leaving the workout workflow. The same question becomes available as a Coach quick action after checking a strength set.

The v6.2 deterministic history engine remains authoritative: the comparison uses the **last checked strength set** (even after the logger advances to a different exercise), one unambiguous saved exercise identity, and corrected recorded history *strictly before* the open workout date. Only explicitly completed saved sets at the same rep count qualify. Missing effort or saved history is acknowledged, never invented.

The cockpit action is hidden for an empty/unchecked workout, cardio-only work, and an open workout dated a different day. It never copies a historical load, changes the set's entered load/reps/RPE/completion, saves a workout, or updates programming. The existing Coach **Return to workout** action remains available. No new data keys, migrations, or production AI secrets.

## Validation and rollback

Validate `npm run check`, `npm test`, full desktop/mobile Chromium regression shards, the actual iPhone WebKit project including `v63-one-tap-comparison.spec.js`, native compilation/beta gates and CodeQL. Physically verify mobile tap behavior, rest timer coexistence, offline PWA, kg/lb display and no unintended writes before merging. Keep the merged **v6.2.0** main release unchanged as rollback.
