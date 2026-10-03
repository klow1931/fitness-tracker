# Loadnote v2.83.0 — Companion Intelligence

v2.83 makes Coach Companion more useful by grounding explanations in the deterministic training evidence Loadnote already maintains.

## What changed

- Added a read-only Companion intelligence snapshot shared by text Companion, secure online Coach, and Voice Companion.
- Added reviewed program / phase / week context from Program Lifecycle.
- Added current session role, goal, planned-set and target-RPE context from the active logger draft.
- Added deterministic next-set evidence from the existing Set Guidance engine.
- Added conservative 12-week strength, consistency, milestone, and recent-change evidence from Progress Stories.
- Added accepted programming-change explanations from the existing athlete-approved review history.
- Added deterministic offline answers for phase, training trend, today’s focus, why-this-set, and why-did-Loadnote-change-this questions.
- Updated the secure Coach instructions so it treats Companion intelligence as deterministic evidence and does not invent readiness, causality, or adaptations.
- Cached the new intelligence modules for the app shell / mobile package.

## What did not change

v2.83 does not add a second programming engine and does not give AI authority over Decisions.

There are no changes to:

- workout-history semantics
- kg/lb storage rules
- target vs actual RPE separation
- e1RM calculations
- training-max calculations
- progression / adaptive programming policy
- fatigue or training-status calculations
- phase / mesocycle policy
- meet-cycle logic

Schema remains **v25** and no migration is required.

## Testing

The release adds coverage for:

- deterministic phase / session / progress intelligence
- current-set RPE guidance
- accepted adaptation evidence
- read-only guardrails
- secure Coach context normalization and prompt policy
- signed-out Companion evidence answers
- signed-in secure Coach evidence transport
- Voice Companion access to the same intelligence snapshot

The complete static, unit, mobile, and desktop/mobile browser release gate is required before merge.
