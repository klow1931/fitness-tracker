# Loadnote v3.90.0 — Evidence Sources and Missing-Data Conversations

## Goal
Make the offline Coach conversationally accountable for *where a training summary comes from*, and what the saved data does not establish.

After a multi-part verified review, athletes can ask “Where did that come from?”, “What data is that based on?”, “Show me the sources”, “What's missing?”, “What don't we know?”, or “What are the limitations?”. The offline Coach re-evaluates its read-only performance, weekly, upcoming-workout and recap evidence cards as of that turn, then reports source attribution, observation, evidence status and remaining limitation. It never reads a prior assistant answer back as fact.

These follow-ups respect earlier user choices such as “Just the performance part”; they do not expand the answer to unrelated sections. The feature uses the existing `coach-reasoning.js` coordinator and `coach-evidence-options.js` summaries, not a second generative explanation model.

## Controls
The original full question still passes urgent/health safety checks before training routing. Source or coverage questions cannot be resolved without a relevant, recent multi-part *athlete-authored* context. Ambiguous lifts or conflicting workout windows prompt questions rather than invented observations. All observations retain their limitation, including missing RPE, incomplete sessions, unknown causes, and training-max versus tested-max distinctions. No proposed changes, automatic approvals, persistent AI memories or new programming rules.

## Tests and release
New `tests/coach-evidence-dialogue.test.js` and `tests/browser/coach-v390.spec.js` cover sources, limitations, chosen-section focus, context expiry, reset, prompt safety, future-data cutoff and read-only storage integrity. Run complete Node, browser, security and native CI before merging.

**Release v3.90.0**, unsigned beta **35000**, schema **34** unchanged, no migration. Keep v3.89 on `main` as rollback.
