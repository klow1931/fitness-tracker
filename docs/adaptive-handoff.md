# Adaptive handoff (v2.71)

## Goal

The post-workout experience should make the adaptive loop visible without pretending that every saved workout causes an automatic program change.

After a saved workout, Loadnote reports one of four states:

- **Next workout unchanged** — the session is retained as evidence, but no applicable review window is open and no accepted revision changed the next session.
- **Weekly/phase review available** — the existing lifecycle says a reviewed period is complete. Future changes still require the existing deterministic evidence checks and explicit athlete approval.
- **Next workout updated** — an accepted review already revised the current Calendar prescription. Loadnote shows the stored before/after prescription plus the existing evidence-based adaptation explanation.
- **No later workout scheduled** — the saved session is retained, but there is no later Calendar prescription to compare.

## Evidence shown

The handoff reuses saved planned-versus-performed data. It may show:

- planned sets represented
- exact load/repetition matches
- paired target RPE versus actual RPE
- exercise-level target/actual RPE averages
- the next scheduled session
- accepted before/after prescription changes

The handoff does not invent missing RPE values, infer recovery, diagnose fatigue, or convert a single workout into a new prescription outside the existing review workflow.

## Authority and mutation rules

adaptive-handoff.js is read-only. It does not write training data or change a schedule.

The current Calendar revision remains the authoritative future prescription. program-lifecycle.js, the weekly/phase review engines, and their existing athlete-confirmation rules remain the authority for whether a review is due and whether a supported change can be accepted.

Accepted revisions are explained through adaptation-explanation.js; the handoff does not create a second adaptation policy.

## Units and data compatibility

Stored loads remain kilograms. Display formatting uses the existing unit conversion helpers.

v2.71 does not change schema v25, e1RM calculations, RPE calculations, training-max calculations, program progression, meet-cycle policy, or migration behavior.
