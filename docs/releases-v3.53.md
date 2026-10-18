# Loadnote v3.53 — Phase 5: Long-Term Adaptive Coaching

Based on the merged v3.48 release. This milestone connects **existing** tested lifecycle, programming-profile, adaptive-outcome and next-session-review engines; it does not create a second progression policy.

## v3.49 — Training-cycle awareness
- Offline Coach can describe the selected saved training program, current week, phase, upcoming scheduled workout and the next reviewed workflow.
- Missing, conflicting or overlapping programs are not silently resolved. Historical questions use a bounded observation/known-at timestamp.

## v3.50 — Observed outcomes after accepted adaptations
- Reuses `LoadnoteAdaptiveOutcomeLearning.analyze` rather than re-estimating progress. Displays observed/unobserved follow-ups and patterns **only when three exact same-lift/same-action follow-ups exist**.
- Shows the missing-data denominator, actual direction counts and RPE-aware median change; no causal performance claim or automatic extrapolation. Existing history guardrails remain primary.

## v3.51 — Saved, athlete-confirmed coaching preferences
- Reuses the versioned `programmingProfiles` storage history for saved goals, experience, training days, session time, equipment, preferred and avoided exercise identities.
- An athlete must explicitly confirm these fields in Profile; **chat text is not silently persisted as memory**, inferred preferences are not represented as facts, and future profile revisions cannot change retrospective answers.
- No new stored field or migration is required.

## v3.52 — Closed-loop next-workout review
- Composes program lifecycle and existing post-session adaptive handoff, with exact planned-vs-logged RPE where available. It shows the current reviewed next action and the existing relevant approved-review button.
- **Does not automatically alter workouts, program sessions or loading.** Approved changes still use existing weekly/phase review and explicit confirmation; skipped/overdue data must be resolved.

## v3.53 — Safety, integrity and Coach regression validation
- New deterministic Node intent/evidence tests and an offline browser acceptance test. Coverage includes historical cutoffs, sparse/no-program scenarios, repeated adaptation evidence, conflicted program states, XSS-safe UI markup and immutable training history.
- Tested output remains descriptive and non-medical. A repeated correlation is not proof of adaptation effectiveness.
- A run through Chromium, iPhone WebKit, native Android/iOS compilation and Android emulator acceptance is required before merge.
- Actual athlete studies remain necessary before effectiveness or long-term intelligence claims can be made.

## Architecture
`src/product/coach-longitudinal.js` is a small read-only adapter over the existing Lifecycle, AdaptiveOutcomeLearning, ProgrammingProfile and AdaptiveHandoff modules.
`src/product/coach-longitudinal-ui.js` adds a collapsed, mobile-friendly detail under Coach/Decisions, not an extra primary dashboard.
`coach-conversation.js` recognizes explicit longitudinal questions and supplies review links routed to the existing lifecycle UI. All views are based on the current state and do not persist conversation history.

## Compatibility
- Data schema unchanged. No unit conversions occur in the longitudinal adapter (the internal kg training engines retain full authority).
- No additional online dependency, remote AI request, secret or model download.
- Retains v3.48 as the rollback until all PR checks pass.
