# Loadnote v3.48 — Phase 4: Offline Coach intelligence

Combines v3.44–v3.48 milestones after merged v3.43. **The default Coach remains deterministic and usable without WebGPU or internet.** All chat-based planning routes to the existing reviewed workflow. This is not unrestricted general intelligence or automatic self-training.

## v3.44 — Intent understanding and conversation
- Added a read-only, safety-first intent router with bounded, user-only lift references and a capability explainer.
- Prior assistant messages are never treated as evidence; greeting/topic changes clear ambiguous prior context.
- Existing exercise-specific, weekly, training-status, programming, and historical evidence handlers remain the authority; no competing decision engine was added.

## v3.45 — More useful offline training knowledge
- Added original, source-linked reference cards for training frequency, competition specificity, deload vs taper, workout evaluation and goal-specific training.
- Reused existing published source summaries and publisher references. **The full NSCA textbook and Book of Methods have not been imported or used for model training.**
- Questions about personal performance are handled through logged-data engines instead of pretending that generalized research established a personal training dose.

## v3.46 — Conversational programming
- Broader natural-language starts and multi-turn requirements are interpreted as drafts.
- Existing reviewed daily-workout and strength/hypertrophy program builders still require confirmed equipment, explicit starting loads and athlete approval.
- Unsupported event/sport programming is routed to the dedicated planning workspace without quietly converting it to general strength work.

## v3.47 — Personalized training recap
- Read-only summary from canonical ProgressStory: 28-day sessions, eligible sets, actual RPE recording coverage, planned-session adherence, supported lift trends and accepted changes.
- Insufficient sets, RPE or resolved sessions remain unknown. Estimated trends do not establish physiological diagnoses or prove a program caused subsequent results.

## v3.48 — Optional device-model reliability
- Offline evidence-backed Coach replies bypass the online client even when the athlete is signed in.
- Experimental WebGPU model text cannot replace supported logged-data or planning decisions. Its session-only diagnostic snapshot records validated response count and latency, not raw prompts.
- A compatible on-device model is *optional* and still requires explicit download/consent and model checks; basic offline coaching does not require it.
- No internet browsing, automatic source ingestion, on-device retraining or unreviewed prescription changes are claimed.

## Storage, safety and validation
- No storage schema migration, kg/lb internal conversion, or workout-history rewrite.
- New Node and Playwright tests cover intents, source coverage, plan review handoff, read-only recaps, future exclusion, offline browser behavior, local-model gating and response metrics.
- CI must pass unit/static, Chromium, mobile WebKit, native compilation and Android beta checks before merge. Real-device and long-term athlete tests remain necessary before commercial release.
