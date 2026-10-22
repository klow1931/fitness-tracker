# Loadnote v3.88.0 — Natural Focus in Coach Conversations

## What changes

Loadnote already has a read-only multi-evidence coordinator for requests like “Why has my bench stalled, and explain my next workout?” This version improves the *conversation that follows*, with athlete phrases such as “Just the performance part,” “Only bench progress,” “The weekly section,” “Only the training recap,” and “Focus on the workout.”

A strictly enumerated language matcher maps those phrases to an existing performance, weekly, upcoming-workout or recap engine. It does not construct a new workout, infer recovery, invent results, alter recorded RPE or authorize load changes. The existing evidence engines recompute answers from validated stored data on every turn.

If the original question has an unresolved lift or conflicting time windows, selecting a part does not silently resolve it: the Coach continues asking which competition lift or date to use. A requested section must have been part of the original compound question.

## Boundaries

The original full question undergoes symptom/urgent support checks first. Recent athlete-authored turns, not Coach output, establish a short conversation topic. A new unrelated question, expired history, or missing compound anchor cannot reuse old topic context. Prescribed weight and observed performance are never conflated; kg storage, lb presentation, and date cutoffs remain unchanged.

## Release integrity

New `tests/coach-natural-clarification.test.js` and `tests/browser/coach-v388.spec.js` cover actual chat turns, focused section selection, ambiguity, safety, out-of-window exclusions and no data writes. Require full static, Node, Chromium, iPhone WebKit, npm security audit, and native/mobile checks before merge.

Release **3.88.0**, unsigned native beta **34800**, schema **34** unchanged, no migration. Preserve merged v3.87 as rollback.
