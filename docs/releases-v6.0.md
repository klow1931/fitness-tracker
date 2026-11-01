# Loadnote v6.0.0 — Training-first Coach: live set reviews

**Version:** 6.0.0 · **unsigned native build:** 38000 · **training schema:** 34 unchanged.

This milestone makes the existing offline Coach more useful **during a real workout**, not just during program creation or general conversation. It builds directly on the merged and CI-validated v5.9 release.

## User experience

- While the strength-workout logger is open, ask **“Review my last checked set”** or **“What did I log for my last set?”** to see the last checked **draft** set shown in the logger: exercise, set position, entered display load/unit, entered reps or duration, and entered RPE or an explicit **RPE not entered**.
- Ask **“Any RPE missing?”** or **“Did I log my RPE?”** to get a count of checked strength draft sets with missing RPE.
- New quick Coach actions appear during an open workout alongside existing navigation and coaching actions, with **Return to workout** to immediately resume logging.
- Coach explains that checked draft boxes are **not saved workout history**, does not infer a successful set from the checkbox or numeric entry, and does not use RPE as medical readiness or a reason to prescribe an unreviewed load change.
- Blank fields remain missing; display weights remain in kg or lb exactly as entered, never mixed with internal kg conversion. Open-draft dates must match the requested date.

## Architecture and integrity

- `src/product/coach-set-review.js` is a deterministic, read-only interpreter over a bounded normalized live-draft context.
- Reuses the existing logger, Coach conversation safety routing and Companion context rather than duplicating persistence or Decisions logic.
- Canonical draft readouts are not replaced by optional local AI model prose; neither online provider nor local model may control the workout's save state.
- No new storage keys, no workout-schema or Coach-memory migration, no automatic workouts, no RPE imputation or load application.
- Existing reviewed programming and training-history engines remain authoritative.

## Acceptance

- `node scripts/check.js`
- `node scripts/test.js`, including `tests/v60-live-set-review.test.js`
- `npx playwright test tests/browser/v60-live-set-review.spec.js --project=chromium`
- `npx playwright test tests/browser/v60-live-set-review.spec.js --project=mobile-webkit`
- Full browser Chromium sharding, WebKit suite, Android/iOS compilation, CodeQL, native/mobile checks and aggregate gate in CI.
- Physical Home Screen/iPhone and Android emulator validation after CI: start a draft, check a set, enter RPE, ask Coach, return to logger and verify nothing was silently saved or changed; confirm kg and lb paths, reload/offline entry and account isolation.

Keep merged **v5.9.0** as the rollback release. This PR is draft until full CI and real-device acceptance. No claim of physical-device certification is made.
