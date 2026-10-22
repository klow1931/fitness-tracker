# Loadnote v3.89.0 — Clearer, Shorter Offline Coach Conversations

## Goal

Give athletes a genuinely easier way to ask for a concise explanation of existing training evidence after a multi-part question. Instead of manufacturing a generic paraphrase, the offline Coach now uses the validated, attributed evidence cards that already power its combined training review.

An athlete may ask "Why has my bench stalled, and explain my next workout?" and then "Give me the short version," "What's the takeaway?", "Can you put that more simply?", "Summarize that," or "In plain English." The reply briefly reports each relevant saved-data section plus its limitation and source. A later "Just the performance part" focuses the reply; asking for a shorter explanation after that stays on performance.

## Evidence and safety

- Every new reply recomputes verified performance, scheduled workout, week, or recap evidence as of the requested date.
- Only recent athlete-authored context is eligible (eight chat rows); assistant text is never treated as logged performance or approval.
- Missing competition-lift identity or conflicting calendar dates still trigger clarification instead of a guessed answer.
- The original full question continues through symptom/crisis safety checks and through the existing validated decisions and program engines.
- No new programming load, causal explanation, medical diagnosis, workout mutation, persistent chat memory or LLM is introduced.

## Quality gate

Added `tests/coach-concise-followups.test.js` and `tests/browser/coach-v389.spec.js` for six natural-language shortcuts, focused conversations, historical cutoffs, safety, read-only responses and real chat UI. Preserve all existing Node/static/security/Chromium/iPhone WebKit/native checks.

Release **3.89.0**, unsigned native beta **34900**, schema **34** unchanged. Keep merged v3.88 as rollback until full CI and installed-offline acceptance.
