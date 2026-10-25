# Loadnote v4.3.0 — Phases 1–5 Consolidation and Long-Term Coach Completion

## Scope and baseline

This release audits the five-stage training roadmap against the **current merged codebase** (v4.2.0). These milestones were already implemented across v3.37, v3.40, v3.43, v3.48 and v3.53. Do **not** replace the engines, add an AI-only identity, or claim physiologically validated autonomous coaching.

The original roadmap and retained implementation evidence:

| Roadmap phase | Implemented foundation | Existing regression evidence | Finding |
|---|---|---|---|
| **1. Training Experience & Reliability** | v3.37: quick RPE completion, next-set flow, dual workout-draft recovery, Today/Train continuity; improved through v3.98–v4.2 | `tests/draft-recovery.test.js`, `tests/browser/mobile-reliability.spec.js`, `tests/browser/training-loop.spec.js`, `tests/browser/v399-logging.spec.js` | Core implementation exists; physical-device interrupted-save tests remain outstanding |
| **2. Adaptive Programming** | v3.40: simpler reviewed strength creation, policy-aware loading styles, evidence-based weekly/phase decisions and approval | `tests/phase2-programming.test.js`, `tests/phase-review.test.js`, `tests/program-lifecycle.test.js`, `tests/adaptive-session.test.js` | Implemented with explicit athlete approval, **not** continuous unreviewed rewriting |
| **3. Progress & Coaching Insights** | v3.43: canonical 28-day Progress facts, RPE-aware lift trend, weekly observations | `tests/phase3-insights.test.js`, `tests/browser/phase3-insights.spec.js`, `tests/progress-story.test.js` | Implemented; trend interpretation remains descriptive |
| **4. Offline Coach Intelligence** | v3.48: deterministic offline intent, source-linked knowledge, reviewed program drafts, structured athlete evidence and optional device-model safeguards | `tests/phase4-coach.test.js`, `tests/browser/phase4-offline-coach.spec.js`, `tests/coach-reasoning.test.js` | Implemented for documented supported intents; not open-ended self-training |
| **5. Long-Term Adaptive Coaching** | v3.53: cycle awareness, outcomes after accepted changes, explicit profile preferences, Coach next-action handoff; further v4.x evidence improvements | `tests/phase5-coaching.test.js`, `tests/browser/phase5-coaching.spec.js`, `tests/coach-outcome-coverage.test.js`, `tests/adaptive-outcome-learning.test.js` | Implemented with a discovered missing next-action route, corrected in v4.3 |

## v4.3 corrective work

- The longitudinal Coach's accepted-action list now recognizes the **existing lifecycle** actions `review-custom` and `keep-plan`; those statuses were previously dropped from Coach reports, despite being valid outcomes of `LoadnoteProgramLifecycle.inspect`.
- The existing long-term Coach details panel exposes the **real review route** for `review-custom`, `review-hypertrophy`, `review-sport` and `review-handoff`. Its button invokes the **current** lifecycle report and the established program UI instead of creating a parallel review policy. `keep-plan` never prompts a redundant review.
- New deterministic Node and browser regression cases cover completed, athlete-authored programs, immutable scheduled history, and genuine UI navigation to the custom program review.
- Core program decisions, data model, units, recovery, local Coach knowledge and training history are otherwise untouched.

## Still outside verified completion

- **On-device acceptance:** Android/iOS force-close recovery, actual keyboard flow, VoiceOver/TalkBack, offline install/update, and long-duration workouts require physical testing and documented results. CI compilation is not proof of these outcomes.
- **Longitudinal athlete evaluation:** Real repeated training blocks, response usefulness, beginner comprehension, opt-in research and actual decision quality need athlete-led pilot testing. Deterministic rules are not proof of superior training outcomes.
- **Account and mobile distribution:** Native local-only storage, manual sync limits, cloud backup/recovery, privacy/legal and Google Play/TestFlight requirements are tracked separately in `docs/phase6-athlete-beta-acceptance.md`. They do not turn into completed features by checking a list.
- **Autonomy boundary:** Loadnote observes training and proposes bounded changes at supported review windows; it **does not** continuously alter loads after each set/workout or learn an unrestricted training policy. Do not advertise it otherwise.

## Release gates

**v4.3.0**, unsigned build **36300**, schema **34** unchanged, no migration. Run `npm run check`, `npm test`, full Playwright Chromium including the new Phase 5 acceptance, selected iPhone WebKit, Android/iOS compile and offline Android beta checks. Keep v4.2.0 on `main` until required CI passes; preserve independent physical-device acceptance records before claiming commercial readiness.
