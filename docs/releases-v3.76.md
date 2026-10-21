# Loadnote v3.76.0 — Bounded Coach dialogue (release candidate)

This development milestone follows the merged v3.75 unified evidence Coach foundation. It improves conversational continuity **without changing the training engines, workouts, stored preferences, data schema (34), or internal weight units (kg)**.

## Changes
- Multi-part questions can be followed by a brief athlete-authored correction such as **"What about squat?"** or a one-word response to a lift clarification. The Coach re-queries actual records for the newly named lift rather than treating earlier assistant text as training evidence.
- **"What about next week?"** after a supported combined answer looks up next week's existing Calendar targets; it does not reschedule a session.
- When the original multi-part request has more than one topic, an ambiguous **"Why?"** requests one specific clarification instead of guessing. If the athlete had already focused a topic, that topic remains the referent for subsequent short follow-ups.
- Explicitly conflicting upcoming-session windows or multiple competing lift names request clarification.
- Bounded history (last eight turns), topic resets, medical/crisis safeguarding, and the existing athlete-reviewed programming workflow remain intact. No new prescriptions, estimated recovery diagnoses or silent writes are introduced.

## Files
- `src/product/coach-reasoning.js` extends v3.75's existing read-only coordinator; no new global Coach module or additional online service is required.
- `tests/coach-dialogue.test.js` adds fixture-based regression tests for short follow-ups, clarified lift selection, incompatible time windows, safety precedence, unavailable history and state immutability.

## Release integrity
- Updated version metadata to **3.76.0** and native beta build number to **33600**.
- Offline service worker advances its cache identifier to support the safe staged-update process.
- No data migration is required; no changes to kg/lb conversion or estimated strength calculations.

## Acceptance
Before merge, require `npm run check`, `npm test`, browser regression and iPhone WebKit suites, beta/native checks, Android/iOS compilation, and the relevant release checks to pass. Cloud compilation alone does not establish physical-device acceptance. Maintain the approved v3.75 rollback until acceptance.
