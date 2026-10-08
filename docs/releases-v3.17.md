# Loadnote v3.17.0 — Coaching continuity and next-workout explanations

Ask Companion about a named accessory, then use **Why?**, **Tell me more**, **Should I keep that weight?**, or **What about next week?**. References remain session-only, use at most eight recent turns and come from user questions. Unrelated topics, health questions and expired history clear the reference. Ambiguous movement references ask for clarification. Assistant claims never become saved targets or training evidence.

Ask **Explain my next workout**, **Explain tomorrow's workout**, or **Explain next week's workout**. In Decisions, **Training context & edits → Explain next workout** opens the same read-only review. The short summary shows the next saved Calendar session, its focus and reviewed phase. **Targets & evidence** expands exact saved loads, sets, reps, effort caps and Calendar revision. Mock/competition event dates appear when the selected reviewed meet cycle supplies them.

The next week means the following Monday–Sunday. Each turn recomputes the current Calendar records. Skipped/cancelled sessions and already linked work are excluded, and overlapping sessions on the selected day require an explicit choice. A rescheduled source session retains its original reviewed phase/week rather than acquiring a new phase from its moved date. Missing or invalid source context is disclosed rather than inventing a reason for an exercise or load. The phase explanation describes the saved structure; it does not establish personal readiness, recovery or the optimal dose. Chat and this review never change training.

## Built-in coaching and the optional device model

The existing built-in coaching engine runs locally without a model download. The optional WebLLM device model adds experimental explanations and supportive conversation when a compatible WebGPU browser/device is available. Initial runtime/model downloads require internet. Loading checks and mock tests do not establish real-device latency, memory use, offline availability or coaching accuracy. Physical iPhone model acceptance remains outstanding.

**Companion → Local AI → How local coaching works** now explains this distinction and fallback behavior. Selecting private local conversation retains the existing no-online-fallback policy even if device inference fails. Exact workout and accessory target reviews bypass generated text; Decisions remains the authority for approved prescriptions. A bounded, fresh training summary and canonical guidance remain the optional model's context, rather than raw logs or assistant assertions as personal evidence. The app does not train a new model from workout records.

## Validation

Unit coverage checks multi-turn references, topic resets, user-only provenance, expiry, ambiguous movements, current Calendar corrections, original source phase/week, units and read-only data. Browser coverage checks the complete accessory-to-next-week conversation, local signed-in routing, keyboard dismissal, 320px light/dark views, expandable targets, correction persistence and local AI settings. The full browser suite and unsigned Android/iOS compilation checks also run in CI. Physical iPhone and VoiceOver acceptance remain manual.

Version **3.17.0**, native build **31700**; schema **32** unchanged.
