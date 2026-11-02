# Loadnote v6.2.0 — Exact-rep checked-set comparison

**Version:** 6.2.0 · **unsigned native build:** 38200 · **training schema:** 34 unchanged.

When a strength workout is open and a performed set is checked, the built-in offline Coach can answer **“Compare my checked set to last time.”** It matches the draft exercise to one saved exercise identity, then examines the latest corrected, saved workout **strictly before** the draft date. A comparison is offered only when that saved session contains an explicitly completed working set at exactly the same rep count.

Coach shows the saved set (converted from stored kg to the unit entered in the draft), the unsaved checked set, each entered RPE or its absence, and a signed load difference only when both loads are valid. This is an arithmetic comparison of log entries, **not** verified progress, medical readiness, or a new target. Unknown RPE, unmarked saved completion, mismatched reps, missing history, stale dates, or ambiguous exercise aliases must not produce invented comparisons.

Reuses `coach-live-history.js` and the corrected `coach-training-history.js` retrieval engine. The history engine's default response remains unchanged; extra numeric and completion evidence is opt-in for this comparison only. No training mutations, new storage keys or schema migrations. Model-generated replies cannot replace this deterministic result.

**Validation gates:** `npm run check`, `npm test`, full Chromium suite, actual iPhone WebKit acceptance, Android/iOS compilation, CodeQL, and offline device logging checks. Verify kg/lb input, checked-set state, corrected saved records and Return to Train. **Rollback:** merged v6.1.0, kept unchanged on `main`. Do not merge before complete checks and device acceptance.
