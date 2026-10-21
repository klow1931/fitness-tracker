# Loadnote v3.81.0 — Context-aware offline Coach

## Product improvement
v3.81 lets an athlete ask **“How does that apply for me?”** after a vetted training principle, such as training frequency, dynamic effort, deloads, hypertrophy or specificity. Unlike a generic training article, the response explains which of their **actual saved data** is available and what remains unknown.

The reply starts from the existing curated knowledge card (with its real source links), then uses the already-shipped Programming Profile and Progress Story-derived 28-day recap to provide two independent kinds of evidence: saved athlete-authored setup and recorded training. It may mention the saved goal, training experience, available days, session time, workouts, working sets and actual logged RPE. It **does not** prescribe a new number of sets, new weekly frequency, rest periods, bar speed, loading percentage or a deload, and it never calculates medical readiness or infers causality.

## Safety and provenance
- Missing programming profiles, unverified records and missing actual RPE are clearly identified instead of being silently treated as negative, zero or completed effort.
- Historical queries use an as-of cutoff for saved profile revisions; later profile edits do not leak into earlier athlete context.
- Available days are *not* evidence of adherence. Total strength sets do *not* establish the exact workload of each muscle group. A logged performance improvement is *not* a verified effect of a specific training adjustment.
- Injury questions, unapproved program edits, explicit workout-history requests and general unrelated questions continue through the existing deterministic safety and planning engines.
- Optional on-device language generation cannot replace an authoritative athlete-context application with invented claims. The existing sourced library and two bounded read-only evidence cards remain visible in Coach and Companion.
- Educational source citations and descriptions are from the existing curated public library, not imported book text or internet retrieval in the gym.

## Architecture
Added `src/product/coach-knowledge-application.js`: a small read-only presentation layer over `programming-profile.js` and `coach-evidence-brief.js`. The library's source lookup and question-context logic is reused. Offline script dependency ordering was corrected so the Progress Story recap engine is initialized before knowledge application. No schema changes or new persistent conversation state. All stored weight values stay in **kg**.

## Release
Version **3.81.0**; unsigned Android/iOS beta build **34100**; schema **34**. Preserve v3.80 as rollback.

## Verification
`tests/coach-knowledge-application.test.js` covers logged evidence, missing RPE, missing/malformed profile, future profile cutoff, no topic, injury routing, source coverage, model guard and immutable data. `tests/browser/coach-v381.spec.js` exercises the narrow mobile Coach surface, source/evidence detail expansion and no writes. Required CI: `npm run check`, `npm test`, complete Playwright Chromium and iPhone WebKit suites, native/beta checks and Android/iOS compilation. Automated tests do not substitute for an actual iPhone Home Screen offline update test.
