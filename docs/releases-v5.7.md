# Loadnote v5.7.0 — Flexible offline Coach conversations

**Version:** 5.7.0 · **Development build:** 37700 · **Schema:** 34 (no migration)  
**Baseline:** merged v5.6.0 (`17f0ac0`) · **Release state:** draft until all CI/device gates pass.

## What changed

The existing full Coach and quick Companion now share one bounded **dialogue-act coordinator**, using the same session-only athlete-authored history. The coordinator handles supported, clearly conversational requests without taking over direct questions answered by the existing training, educational, or live workout engines.

- Explicit requests to **talk, vent, or just listen** do not force the old situation → goal → options → step → obstacle form.
- The athlete can **correct** a statement, **ask for ideas**, interrupt with a factual training question, and explicitly **resume** an earlier topic. A resumed topic uses recent user statements only; assistant text is not evidence.
- Mixed statements such as “Bench was fine; work was stressful, I want to vent” preserve the requested listening context. They do not assert that the athlete's reported bench work is verified history.
- “That's all for now” and similar explicit endings close naturally with no follow-up question. Greetings and direct factual/technical requests keep their established handlers.
- Topic frames are limited to the latest 24 messages, two explicitly opened topics, and the last four relevant athlete statements per frame. Frames never persist across a reload, and the existing Clear conversation flow removes them.
- Ambiguous returns (“back to that” with multiple prior topics) clarify rather than choose arbitrarily. Health, urgent-support, new-topic, and explicit session resets block access to older conversation frames.

## Scope and implementation

- New focused module: `src/product/coach-conversation-flow.js`. It handles dialogue acts and composes **user-report** responses only, with read-only metadata.
- Integrated once in `src/product/coach-conversation.js`. Factual coaching, training data, numeric calculations and approved changes remain owned by the existing engines.
- Shared full/quick surface history is reused; no duplicate chat transcript, no remote request and no new memory database.
- New module is loaded in `index.html` and explicitly included in the PWA shell cache.
- No changes to kg/lb conversions, RPE, training maxima, phase progression, program approvals, workout records, storage schema or cloud configuration.

**Product boundary:** This is a more adaptable authored conversational system, **not** a newly trained LLM, persistent personal memory, unrestricted factual reasoning or a clinical support system. Existing guided reflection remains as an optional supported flow. Do not describe user-reported concerns as measured training outcomes.

## Validation

- `tests/v57-flexible-conversation.test.js` covers ten-turn recovery, partial corrections, multiple topics, unverified assistant claims, listening without forced prompts, direct training questions, emergency/health precedence, closure and history immutability.
- `tests/browser/v57-flexible-conversation.spec.js` covers the full offline Coach, quick Companion continuity, mixed requests, safety, Clear conversation, mobile viewport and no saved-data writes. Added to selected WebKit suite.
- Execute `node scripts/train-coach-intents.js --check`, `npm run eval:understanding`, `npm run check`, `npm test`, all browser shards, selected iPhone WebKit, Android/iOS compile, and Android beta. Keep the online service and optional downloaded model disabled for offline acceptance.
- Separately verify airplane-mode iPhone Home Screen and Android emulator start, device latency and accessibility; CI is **not** physical-device acceptance.

## Next milestones

v5.8: opt-in, inspectable approved memory with its own schema/migrations, profile conflict rules and backup controls.  
v5.9: typed response composition, fewer repeated phrases, better listening/idea/explanation modes.  
Do not silently add persistent memory as a side effect of v5.7.

Preserve the merged v5.6.0 release for rollback until v5.7 passes all checks and user validation.
