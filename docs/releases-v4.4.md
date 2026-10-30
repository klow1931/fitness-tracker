# Loadnote v4.4.0 — Offline Coach, Natural Follow-Ups

## Purpose

Improve how athletes converse with the **offline** Coach, without switching training decisions to an unrestricted language model. This is the first increment of a communication-focused series; it is not a claim of generalized chatbot intelligence.

## What's new

- **Shorter, plain-English follow-ups** after a supported single-topic athlete question: e.g. “Can you say that in plain English?”, “Give me the quick takeaway,” “Could you break that down?”, “What does that actually mean?”
- **More detail on request**: “Can you expand on that?” recomputes the original question from current saved training and provides its full validated explanation.
- The follow-up resolves to **recent athlete-authored questions**, not assistant replies, model text, or guessed hidden memory. Topic changes, safety reports and missing context reset the referent. At most two consecutive language-only follow-ups are supported within the latest eight messages.
- Validated concise outputs use the canonical engines' existing `clarity` fields or validated evidence cards. They retain report provenance, safe inspection actions and units; unknown results remain unknown.
- A request without supported source-backed summary retains the original explanation rather than cutting away its limitations.
- The existing Coach Companion's three-section card is intentionally bypassed **only for a chosen brief/detail follow-up**, so the requested response is actually displayed.

## Safeguards and non-goals

- The approved schedule, completed sets, training maxes, kg storage, RPE math, exercise identity, and review policy remain untouched.
- No chat-controlled load change, athlete preference save, fabricated personal progress, medical interpretation, or pseudo-memory.
- Existing supported compound questions continue to use the multi-evidence Coach coordinator; v4.4 does not silently reduce them to a single source.
- Training facts and personalization are still recomputed using existing offline engines. The optional on-device generative model remains a separate experimental path; **no additional downloads or WebGPU requirements** are introduced.
- Conversation history remains session-only, and personal data is not stored by this feature.

## Verification

- New `tests/v44-offline-dialogue.test.js` covers user-only references, plain-English/direct and chained follow-ups, safety, topic resets, stale/future data, immutable training state, and preserved attribution.
- New `tests/browser/v44-offline-dialogue.spec.js` covers offline Companion usability on iPhone-size viewports, a brief/detail conversation, topic reset, health boundaries and no training writes; include in selected mobile WebKit suite.
- Full suite: `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native`, full Playwright shards, selected WebKit, unsigned Android/iOS and Android beta.
- A follow-up release can expand to a better coaching style and optional language generation after validated evidence routing.

## Release

**4.4.0**, unsigned native build **36400**; storage schema **34**, **no migration**. Base PR is v4.3, which itself still needs full CI validation and merge. Keep the last merged release v4.2.0 untouched on `main` until all intermediate PRs pass. Don't merge a stacked release out of order.
