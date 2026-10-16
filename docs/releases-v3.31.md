# Loadnote v3.31.0 — Offline Coach intelligence foundation

## New capabilities
- Offline Coach reviews the most recent three actual recorded workouts for a named exercise beyond only competition squat, bench and deadlift. Saved exercise IDs are authoritative; unique legacy-name records can be reviewed, but ambiguous catalog names require clarification.
- The coach counts explicitly completed sets separately from saved sets whose completion was not marked. Skipped, warm-up, explicitly incomplete, or content-free sets are excluded. Missing RPE stays unknown, internal kg are converted only for display, and future-dated workouts are excluded.
- Short follow-ups such as "What about last time?" and "What about lat pulldown?" can reuse only a bounded last user-requested training-history topic. An unrelated user turn clears the reference; assistant messages never become evidence. Every request reads today's corrected stored history again.
- The offline Coach can describe saved athlete setup (goal, experience, days, session duration, available equipment, preferred and excluded movements). It explicitly states when setup is missing and never treats unsaved chat as persistent memory or includes athlete free-text health notes.
- Factual history and saved-preference answers remain deterministic even if experimental on-device language-model conversation is enabled. The local model can still help with eligible general education and encouragement.

## Boundaries
- No model weights are trained, no Internet research is performed and no generative model is made mandatory. This release improves the offline intelligence layer and evidence tooling, not autonomous learning.
- No stored schema changes (schema 32), workout history mutation, automatic load changes, training-max adjustments or unapproved programming edits.
- Existing competition-lift evidence, fatigue/review gates, injury boundaries, powerlifting progression, kg/lb calculations and old messages continue to use their dedicated handlers.
- New unit and browser tests cover fresh data, history fidelity, missing/ambiguous exercise identity, conversion, bounded reference memory, medical guard precedence, and explicit preference privacy.
- Verify `npm run check`, `npm test`, Chromium browser shards, iPhone WebKit, mobile/native packaging, Android beta and iOS/Android compilation before merging. Device acceptance remains a separate activity.
