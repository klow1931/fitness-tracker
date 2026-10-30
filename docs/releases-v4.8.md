# Loadnote v4.8 milestone — Conversation to reviewed workout

Delivered together with v4.9 and v5.0 in **v5.0.0**.

- Recognize time-and-equipment requests such as “I have half an hour and only dumbbells.” Unsupported or missing parameters remain questions.
- Offer one focused clarification and relevant reply buttons at a time. A bare number is interpreted only when the pending question unambiguously asks for weeks, days or minutes.
- Preserve structured request fields during corrections and short educational asides. Assistant prose is never a source of agreed values. Health, reset and discarded-request boundaries stop old request reuse.
- Show explicit before/after request changes in conversation and draft review. Daily-versus-multiweek ambiguity, conflicting goals, duration and focus require clarification.
- Reuse confirmed setup only when asked. Availability alone never becomes a chosen training frequency; chat never saves a preference or overwrites a log.
- Explain movement suggestions using requested equipment, focus, explicit preferences and exclusions. No invented individual weakness or optimal training dose is asserted.

Existing designers own final exercise/load reviews, estimated work duration, progression and saving. Fresh starting loads and explicit approval remain necessary. Session dialogue is cleared with Coach conversation and is not persistent model memory.
