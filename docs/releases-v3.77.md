# Loadnote v3.77.0 — Explainable Coach Evidence and Reviewed Options

## Improvements
- A read-only **Evidence at a glance** section accompanies supported compound Coach replies: up to three concise entries from corrected training trends, completed-week reviews, training recaps and exact saved Calendar sessions. Each identifies its origin and limitations.
- When existing engines provide different observations (such as improved estimated lift capacity and above-cap or missing weekly effort), the Coach identifies the difference without claiming a cause or overriding approved progression policies.
- **"Compare my options for next week"** uses the existing `LoadnoteWeeklyCoaching.review` evidence and offers keeping approved targets versus reviewing an *already-supported* proposal when it exists. Ambiguous programs, incomplete weeks and insufficient data produce no invented adjustment.
- Evidence cards are collapsed by default and use text-only DOM construction. Coaching remains responsive and training changes require separate Decisions approval.

## Boundaries and architecture
- `src/product/coach-evidence-options.js` formats bounded read-only evidence and reviewed options without changing original training calculations.
- `src/product/coach-reasoning.js` integrates source summaries and contradictory-signal notices; `src/product/coach-conversation.js` routes explicit comparisons after medical/crisis screening and draft-program handling.
- `src/product/coach-companion-ui.js` shows source-labeled cards without HTML injection or write actions. No new persisted athlete data, no schema migration, no recovery diagnosis and no AI-generated prescriptions.
- Data schema remains **34**, internal strength loads remain **kg**.

## Verification and release
Version **3.77.0** and unsigned native beta build **33700**. Tests cover missing RPE, contradictory observations, unverified progress, ambiguous/incomplete reviews, absence of writes and existing reviewed comparisons.

Require `npm run check`, `npm test`, desktop/mobile Playwright suites, iPhone WebKit checks, native/beta checks and Android/iOS compilation before promoting. Automated checks are not physical-device acceptance. Preserve merged v3.76 as rollback until validation.
