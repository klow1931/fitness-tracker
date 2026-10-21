# Coach 2.0: v3.75 unified evidence foundation (draft)

## Purpose

Loadnote already has deterministic, read-only analyses for RPE-aware lift trends, weekly program reviews, scheduled workout targets, and recent training recaps. The first Coach 2.0 milestone links those analyses **only when a question explicitly contains two or more independent information requests**. It does not introduce a language model, change training progression, or modify a single saved record.

## Modules and boundaries

- `src/product/coach-reasoning.js` parses compound informational questions and invokes existing domain-specific `answer()` functions. It returns the original engine's evidence and source identifiers, with a bounded audit of the domains used.
- `coach-conversation.js` keeps medical/crisis screening, capability routing, draft-program review and movement clarification *ahead* of the new coordinator.
- The coordinator never calculates sets, reps, loads, 1RMs or training maxes. It cannot save a workout, set a training preference, schedule a session, or approve a future prescription.
- Only explicit inspection/navigation actions from existing engines are passed through. If an evidence engine fails, the answer says that the evidence cannot be validated.
- Data is read fresh on every question. Conversation history is never a source of workout facts; the coordinator does not introduce persistent memory.
- The response is grounded in current saved targets and records for the specified analysis date. Missing/unmapped and uncertain evidence stays visibly unknown.

## Initial covered queries

- "Why has my bench stalled, and explain my next workout?"
- "How did this week go, and explain my next workout?"
- "Summarize my training and explain my next workout."

Other compound topics and more sophisticated multi-turn referents are **not** claimed to work yet. Single-topic queries still follow their established handlers.

## Tests and release gates

`tests/coach-reasoning.test.js` tests multiple supported domains, ambiguous lift clarification, medical-boundary precedence, no accidental routing of drafting/change requests, historical cutoff and state immutability.

Before release: complete `npm run check`, `npm test`, the existing Playwright mobile and desktop suites, and native build checks; verify responsive presentation of compound answers on iPhone. Preserve a rollback version; do not merge this draft until checks pass.

## Next increments

- **v3.76:** explicit multi-turn referent resolver and one-question clarification for conflicting goals or constraints
- **v3.77:** bounded evidence-summary cards, deterministic option comparison for existing *reviewed* programming tools, and evaluation fixtures for contradictory/missing evidence

Long-term personalization, reviewed programming generation, curated knowledge retrieval and optional local language enhancements remain later milestones, not features of this module.
