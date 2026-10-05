# Loadnote v3.1.0 — Reviewed adaptive sessions

Decisions → Adapt planned session brings time and equipment constraints into one before/after review. Coach and Companion route to the same controls. A checked approval appends a Calendar revision; the original frozen program and completed workouts are not rewritten. Finish or clear open workout/sport drafts first.

## Scope

- Full Coach and quick-access Companion now use one session-only conversation controller, history and transcript. Switching views preserves follow-ups; clearing either clears both. The full screen retains structured online analysis. Concurrent sends and clears during a pending turn cannot split the conversation. The floating launcher is hidden on the full conversation screen, not the program/review workspace.
- Offline support acknowledges athlete-stated motivation, setbacks, gym confidence, solo training and completed sessions. It asks a focused follow-up, encourages sustainable participation and honest logging, and does not invent achievements, diagnose feelings, provide a spotter or pressure athletes through pain. Safety language takes precedence; immediate danger/self-harm prompts direct to human emergency/crisis support. These are bounded conversational responses, not therapy or safety monitoring.
- Additional educational questions cover strength versus hypertrophy, failure, rest and power with primary-source links. The ACSM 2026 overview informs the new strength/failure explanations; these are general healthy-adult findings, not personalized load/volume prescriptions. Existing sport, workload and reviewed-program evidence remains authoritative.
- Full-screen assistant bubbles use explicit light/dark colors for readable text. Both chat views escape athlete-provided content and expose the same evidence-review actions.
- Time budgets estimate setup, set execution, transitions and recorded rest. Where rest is absent, an explicit user-entered assumption is required. Warm-up, queues and interruptions are excluded, so estimates are not guarantees. Only athlete-selected phase/meet accessories may be omitted; essential work can still exceed the budget.
- Replacements are limited to reviewed phase/meet accessories. Both identities need athlete-confirmed purpose, muscle group, equipment and load convention. Available equipment must be confirmed, excluded identities are filtered, and sets/reps/load/effort/rest are entered afresh. The supported accessory policy is 1–3 sets, 6–20 reps and an RPE cap of 6–8; malformed values are rejected, not clamped or silently dropped. Matching purpose is not proof of equivalent stimulus. Primary lifts, Olympic practice and athletic protocols are protected.
- Training preferences store equipment, time budget, exclusions and confirmed movement mappings on this device. They do not sync with the account or appear in training backups. Saving or rejecting a chat answer does not silently train a policy. Calendar target changes themselves remain in the existing backup/sync pipeline.
- Exercise guidance is one control beside the current workout. Three exact-movement cards (Goblet Squat, Dumbbell Bench Press, Hammer Curl) offer short original educational summaries and external ACE instruction links, alongside the athlete’s saved notes. Unsupported movements explicitly fall back to reviewed protocols/qualified instruction. No licensed media, video analysis, personalized technique diagnosis or broad exercise-library parity is claimed.

## Sources

Reviewed October 5, 2026: [ACE Goblet Squat](https://www.acefitness.org/resources/everyone/exercise-library/362/goblet-squat/), [ACE Chest Press](https://www.acefitness.org/resources/everyone/exercise-library/19/chest-press/), [ACE Hammer Curl](https://www.acefitness.org/resources/everyone/exercise-library/10/hammer-curl/). Cards are brief paraphrases, not copied articles or media; external demonstrations require internet.

Additional educational sources: [ACSM resistance training position stand (2026)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/), [IUSCA hypertrophy position stand (2021)](https://doi.org/10.47206/ijsc.v1i1.81), [NSCA weightlifting for sports performance (2023)](https://pubmed.ncbi.nlm.nih.gov/36952649/). Crisis resources verified against [US 988 Lifeline](https://988lifeline.org/contact-us/) and [Canada 9-8-8](https://988.ca/). No copied media or full-text redistribution.

Schema 31 remains compatible. Release 3.1.0 and unsigned native build 30100. Browser tests and unsigned compilation do not establish physical-device acceptance.

## CI regression correction

The full browser run exposed three older cross-view scenarios on both desktop and mobile that clicked the intentionally hidden Companion launcher inside full Coach. They now use the visible Home navigation before opening Companion and verify the shared transcript is preserved, retaining their evidence and training-data immutability assertions. No runtime training behavior or schema changed.
