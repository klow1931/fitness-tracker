# v3.87.0 — Offline Coach Conversation Continuity

## Behavior
This incremental update lets the deterministic offline Coach retain a clearly stated lift and question type over a short, bounded conversation, without guessing unspoken movements.

Example conversations include "How is my squat progress?" → "What about bench?" → "Actually, I meant deadlift." A previously mentioned athlete-approved adjustment can be followed with "Did that help?" to request its exact saved follow-up evidence, and "Why was it approved?" to retrieve the original frozen review reason. Those are *read-only* views of the existing programming evidence, not new recommendations or actions.

Corrections require an explicitly named squat, bench or deadlift. Unrelated turns, symptom reports, conflicting movements and missing referents end the chain. Only user messages in the latest eight chat rows are eligible, with at most three short follow-ups between full questions; assistant claims are never used as evidence.

## Integrity
The existing coach-language.js adapter resolves wording, but the workout and approved Decisions engines must validate the requested evidence on each turn. Original full question safety checks run before interpretation. No workout, program, approval, profile or weight units are written; no new fatigue or medical claims. Schema 34 unchanged.

Tests: tests/coach-dialogue-continuity.test.js and tests/browser/coach-v387.spec.js, plus the entire existing Node, Chromium, iPhone WebKit, mobile/native/security suite.

Version 3.87.0, unsigned mobile beta 34700. Preserve v3.86 as the rollback and retain a draft PR until CI and device/offline acceptance.
