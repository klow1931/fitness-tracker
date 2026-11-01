# Loadnote v5.9.0 — Contextual approved-memory recall

**Version:** 5.9.0 · **unsigned build:** 37900 · **training schema:** 34 unchanged · **Coach note schema:** 1 unchanged.

Builds on the merged v5.8 release. The purpose is to make deliberately saved Coach notes useful in natural follow-up conversations without presenting any chat history as durable memory.

## What changed

- Natural requests such as “Remind me why I train,” “What was my routine?”, “What name should you call me?”, “What should you follow up about?”, and “Where did we leave off?” can read matching **approved device-local notes**.
- Missing, corrupt, expired, unapproved or wrong-account notes return an explicit limitation instead of guessed personal history.
- “Where did we leave off?” **does not reconstruct a prior conversation**. It states that previous chat transcripts are not retained, and only presents up to three approved next-visit, goal and routine notes. Saved notes are user statements, not logged adherence.
- When a category contains several notes, the reply shows at most three and directs the user to the existing **Things Coach remembers** review/edit/delete controls for the rest.
- No new permission or storage key, no automatic saving, no Coach notes sent to online chat, no unreviewed training changes, no extra third-party API or downloaded model. The existing training and fatigue engines remain authoritative.

## Verification

- `node scripts/check.js`
- `node scripts/test.js` — includes `tests/v59-coach-memory-recall.test.js` for explicit-intent boundaries, consent, corruption, expiry, scope isolation, health safety and training immutability.
- `npx playwright test tests/browser/v59-coach-memory-recall.spec.js --project=chromium`
- `npx playwright test tests/browser/v59-coach-memory-recall.spec.js --project=mobile-webkit`
- Full `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native`, CI Chromium shards, iPhone WebKit and compilation gates.
- After CI, manually confirm a web install and iPhone Home Screen app refresh offline, account switching, removal/expiry handling, and no disruption to workout logging.

## Release and rollback

Development PR against merged v5.8. Do not merge or promote to release until CI and browser gates pass. Keep the merged v5.8.0 release as rollback. Version/build changes do not alter training data schema 34 or Coach memory schema 1, so there is no data migration. Updating the service-worker cache includes the new recall module for offline use.
