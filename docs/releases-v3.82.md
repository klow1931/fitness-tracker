# Loadnote v3.82.0 — Reviewed program context in the offline Coach

## Athlete experience

When the athlete asks **“How does that apply for me?”** after an eligible curated training principle, the existing offline Coach now checks three independent evidence categories:

1. Athlete-authored programming profile (availability, goal, experience).
2. Actual 28-day logged workouts and recorded RPE, including missing effort.
3. The **selected reviewed program** and its exact resolved Calendar sessions when a single program is verifiable.

The Coach can state the saved program name, confirmed phase/week, completed and explicitly skipped resolved sessions, and **completed / (completed + explicitly skipped)** adherence. When the denominator is zero, it says adherence is unknown. Unconfirmed, cancelled, upcoming and unavailable sessions are not automatically failures; saved availability is not attendance.

Up to three collapsed source-labeled evidence cards use the existing Coach UI. No new forms, changes to the logger, training frequency, dosages, prescriptions, or new program engine.

## Implementation

- Extend `src/product/coach-knowledge-application.js` with the existing read-only `LoadnoteProgressStory.selectedProgram` function.
- Reuse the authoritative program lifecycle and Calendar resolution model rather than implementing another attendance calculator.
- Program evidence is omitted if it cannot be validated; no simulated/synthetic data is presented as personal history.
- Preserves v3.80 citations and source coverage, v3.81 profile/log guards, medical priority, optional model boundaries and separate athlete approval of any future training change.
- Internal weights remain **kg**, display conversion stays independent, schema remains **34**, no migration or training-data writes.

## Version and verification

Version **3.82.0**, unsigned native beta **34200**. Preserve v3.81 as rollback.

New `tests/coach-program-application.test.js` verifies exact scheduled attendance, missing denominator, unknown program, no state mutation and source provenance. The mandatory checks remain `npm run check`, `npm test`, complete Chromium and iPhone WebKit Playwright, mobile/native source gates, Android/iOS compilation and on-device iPhone Home Screen/offline update tests before consumer promotion.
