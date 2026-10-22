# Loadnote v3.84.0 — Explain the evidence behind approved changes

## Athlete experience

The offline Coach now answers requests like **“Why are my approved squat adjustments missing comparable evidence?”**. It examines only validated historical athlete-approved changes and exact linked workout comparisons provided by the existing `adaptive-outcome-learning.js` engine. It distinguishes observed change outcomes from cases where a comparison cannot be established.

A missing comparison is described conservatively in these categories: incomplete baseline links; incomplete follow-up links; unavailable baseline RPE-aware estimate; unavailable follow-up RPE-aware estimate; and otherwise incomparable evidence. Exact linked-session counts are presented only when they exist in validated records. The Coach does not conclude that an athlete missed a workout, omitted RPE, was fatigued or recovered poorly just because an estimate is unavailable.

No new metric, scoring model or autonomous progression policy is added. When outcomes exist, Loadnote continues to call them descriptive associations rather than evidence that the programming adjustment caused the result. The existing reviewed Decisions workflow remains the only path for changing future targets.

## Implementation

Small extension to `src/product/coach-outcome-review.js`; classifies the existing phase/meet outcome records, adds a coverage-specific conversational intent, and exposes the reasons alongside prior source-labeled outcome evidence. It is read-only. No data migration or training writes; internal kg and RPE calculations are unchanged.

## Tests and release gate

`tests/coach-outcome-coverage.test.js` verifies category precedence, sparse/unknown data, latest outcome, historical knowledge cutoffs, multi-lift clarification, medical query routing, and snapshot immutability. Pre-merge gates: `npm run check`, `npm test`, full desktop/mobile Chromium, iPhone WebKit and mobile/native/beta source checks plus Android/iOS compilation. Device acceptance includes iPhone Home Screen/offline training and backup verification.

Version **3.84.0**, native unsigned beta **34400**; data schema **34**. Preserve v3.83 as rollback.
