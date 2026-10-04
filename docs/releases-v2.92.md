# Loadnote v2.92.0 — Conversational Local Coach

Shared read-only explanation layer for full Coach and Companion. Short follow-ups retain the prior topic/lift; explicit topic changes stop carryover. History is bounded to 24 messages per surface, stays in memory, and can be cleared together from Coach. No new persistent schema or uploaded training data.

Mapped squat, bench and deadlift questions use a fresh current-corrected readiness snapshot with analysis date/window, mapped movement, logged load, estimated capacity and evidence gaps. Training max, reported 1RM and legacy profile benchmark remain separate; corrected history is explicitly distinguished from historical as-recorded replay. Future workouts are excluded. No load change is inferred from a completed set or a generic progression question.

Built-in explanations cover accessory selection/progression constraints, actual versus planned RPE, reviewed program lifecycle and previous logger comparisons. Unknown questions request clarification instead of promising unrestricted AI intelligence. Pain/injury questions are routed to a capability limit, not a diagnosis or rehabilitation prescription. Session/context explanations describe stored targets; they do not create Decisions recommendations or mutate training data.

Existing optional signed-in web Coach transport remains unchanged. Native beta remains local-only. Rest timer convenience actions retain existing permissions. No signing, TestFlight, provider activation or store submission. Schema 25 unchanged; unsigned native build 29200. Physical-device acceptance remains outstanding.

Validation: unit coverage for bounded follow-ups/topic resets, canonical mappings, missing data, distinct benchmarks, units, future exclusion and immutability. Desktop/mobile browser coverage for both offline surfaces, clear-context behavior, read-only training state and escaped hostile movement labels, plus existing Companion/secure Coach regressions.
