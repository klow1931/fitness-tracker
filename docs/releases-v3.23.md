# Loadnote v3.23.0 — Coaching boundaries and release rehearsal

Schema stays 32. Build 32300. Decision policy version 6 records the new restrictions without rewriting existing decision events or training targets.

## Boundary changes

The core squat/bench/deadlift direction engine now checks the current programming profile and intake before interpreting a trend. Active reported symptoms, urgent intake flags, review-needed activity and mapped avoided movements withhold a loading direction. Missing intake is still unknown, not medical clearance. Invalid profile/intake records fail closed. Historical as-recorded reviews respect the profile knowledge cutoff; current-corrected reviews use current restrictions.

Matching lift records in the evidence window are checked for invalid RPE/load, suspicious loads using the existing integrity rule, and missing/duplicate workout IDs before replay can collapse them. Other lifts and future workouts do not become evidence for this lift. A blocked reply does not tell the athlete the existing plan is safe. Missing effort remains missing; it is never filled from planned RPE.

Coach health/crisis boundaries precede movement clarification, educational replies, reversible timer commands and online/local generated conversation. Numbness, tingling, light-headedness and breathing-related wording now route to the capability limit. Safety checking examines the original question before truncation. Replies remain read-only and are authoritative built-in replies, not prompts for a paid model to override. Ordinary chest-supported-row questions remain exercise questions.

These are deterministic safeguards, not a validated symptom classifier, diagnosis or medical clearance. Wording coverage is finite; severe symptoms require real-world help, not a chat response. Emergency-help wording follows [NHS emergency guidance](https://www.nhs.uk/symptoms/shortness-of-breath/) without introducing treatment or rehabilitation doses.

## Engineering review matrix

| Scenario | Expected boundary | Automated evidence |
|---|---|---|
| Null/empty/invalid effort | No increase authorized; no invented effort | coaching-boundaries.test.js |
| Existing suspicious-load rule triggered | Review records before a direction | coaching-boundaries.test.js |
| Duplicate/missing workout identity | Withhold direction before replay deduplication | coaching-boundaries.test.js |
| Active symptoms / urgent flag / avoided lift | No direction or medical clearance | coaching-boundaries.test.js |
| Later workouts / profile changes | Corrected and historical modes remain distinct | coaching-boundaries.test.js |
| Symptom or crisis mixed with workout question | Built-in boundary before provider/timer | coaching-boundaries.test.js; browser/coaching-boundaries.spec.js |
| Submaximal single, stale evidence, conflicting block, missing prescription | Existing conservative guards retained | decision-engine.test.js; decision-readiness.test.js; block-decision-context.test.js |
| Skipped/missed/unconfirmed work and save failures | No invented completion or silent plan writes | existing first-week, training-loop, schedule and review suites |

Engineering review is not independent coaching approval. A qualified reviewer must still assess representative return, accumulation, hypertrophy, strength, deload and meet/peak cases, including accessory selection, sport conflicts, exercise exclusions and feedback-triggered changes. Record reviewer, qualifications, version/commit, cases reviewed, limitations and findings. Do not describe automated assertions as expert sign-off or evidence of superior outcomes.

## Android release rehearsal

`npm run check:android:release -- --unsigned` checks JDK 21, API 36/build-tools 36.0.0, bundletool presence and absence of owner signing variables. CI performs this before actual unsigned AAB compilation and bundletool validation. It is read-only and emits no key paths, aliases or passwords. `npm run check:android:release` instead checks owner signing configuration and a real absolute keystore file. It does not inspect key contents or verify approved key identity.

Owner procedure, on a private build machine:

1. Run `npm ci`, `npm run check:native`, and `npm run setup:bundletool`.
2. Supply the four signing environment variables described in releases-v3.22.md through a private secret manager/shell. Never send signing files or passwords through chat.
3. Run `npm run check:android:release`, then `npm run build:android:aab:signed`.
4. Independently compare the signing certificate with the owner's approved upload certificate/Play configuration. A signature that verifies does not itself establish the correct owner identity.
5. Test an installed release through an approved track and complete every physical-device row in native-device-acceptance.md. Use disposable synthetic data and an external verified backup for destructive recovery/upgrade tests.
6. Record the artifact SHA-256, version/build, source commit, CI links, approved signing identity, device evidence, confidential support contact, published privacy URL and Play declaration review. Block release on missing evidence or data-loss/restore failures.

Current local rehearsal is blocked by unavailable JDK 21/Android SDK and owner signing material. The CI unsigned rehearsal cannot fill the owner-signed or physical-device rows. `storeReady` intentionally remains false in every preflight result, including a successful one. No production key is created or used by this update.

## Owner checklist

- Independent coaching review: **not completed**.
- Owner-approved upload certificate/signing: **not completed here**.
- Signed physical Android acceptance and upgrade/restore: **not completed here**.
- Confidential support contact and final public policy: **owner verification required**.
- Play Console identity, Data safety, health declaration, listing and applicable testing: **owner verification required**.
- Final-head CI: review the PR checks; this source document does not certify a changing workflow state.

Do not claim universal injury safety, clinical rehabilitation, proven superiority or autonomous program changes. Local-first logging, reviewed adaptation, explicit unknowns and evidence-linked decisions are demonstrable product behaviors, not outcome guarantees.
