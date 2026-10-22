# Loadnote v3.85.0 — Coach explains the reason behind an approved change

## Product behavior

Ask the offline Coach **“Why did Loadnote change my squat?”**, **“Why was my approved bench load reduced?”**, or **“Explain why my approved deadlift adjustment was made.”** The Coach identifies the latest eligible athlete-approved phase/meet adjustment for the named lift. It retrieves the **original frozen review reason and policy** that existed when the athlete approved the decision.

For phase programs, the reason is the accepted phase finding stored in `phaseReviews`; for meet cycles, it is the recorded action-specific weekly finding stored in `meetCycles[].weeklyReviews[].report`. Both require validated saved source records and are matched to the already-shipped `adaptive-outcome-learning.js` accepted review IDs. No fresh policy simulation and no guessed retrospective rationale.

The answer distinguishes:
- **Why the change was offered:** the saved eligibility/review reason.
- **What the athlete approved:** the accepted action and approval date.
- **What happened afterward:** a comparable RPE-aware follow-up observation *only if* the existing outcome engine validates it, otherwise unknown.

An accepted training decision is not a diagnosis, a guarantee of effectiveness, or evidence of a particular athlete motive. Later decisions and workout events must not leak into historical answers. Multiple named lifts prompt clarification. A question about current proposed decisions continues to use the existing Decision Explanation and Decisions workflow.

## Integrity and testing

Extend the existing `coach-outcome-review.js` module instead of creating a new source of prescription logic. No training data writes, exercise changes or schema migration. Data schema **34** and internal weights in **kg** remain unchanged. New `tests/coach-approved-rationale.test.js` checks saved phase and meet decisions, historical cutoffs, read-only behavior and routing.

Release **3.85.0**, unsigned mobile beta **34500**. Require Node/static checks, Chromium browser shards, iPhone WebKit, native source validation and Android/iOS compilation, plus athlete-led Home Screen/offline/save/restore acceptance before merging. Preserve v3.84 as a rollback.
