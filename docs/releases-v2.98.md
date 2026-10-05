# Loadnote v2.98.0

Decisions, Coach and Companion now share a current corrected coaching snapshot covering confirmed goals, reviewed programs, current Calendar targets, recorded work, effort gaps and separate sport observations.

- Weekly reviews save explicit athlete-reported sleep, soreness and fatigue, including unknown values. Reports do not become measured recovery scores.
- Future-session proposals preview all affected dates and targets. Supported hypertrophy increments require the existing two-session evidence gate; sport concerns can offer an explicitly reviewed deferral. Chat cannot approve changes.
- Accepted changes append Calendar revisions without rewriting completed work or frozen program configurations. Follow-up attribution requires the exact approved prescription and revision; completion does not prove causation.
- Companion works inside the sport-session recorder and explains the selected drill or attempt's reviewed purpose and stop protocol. Athletic observation corrections preserve prior revisions and recorded identities.
- Schema 30 preserves review history in backups and sync, and migrates older states with an empty review ledger.

Limits: this release does not automatically learn individualized training policies, infer readiness from missing measurements, diagnose technique, generate sport doses, or verify reported reviewer identities. Hypertrophy proposals currently support the first reviewed increment per exercise/program; further progression stays in explicit program review.

Validation: all 137 Node test files pass. The full desktop/mobile browser run passed 524/526; its mobile-card regression was fixed and its browser-launch failure passed on rerun. The final targeted run passed 42/42, including the two additional correction scenarios (528 unique scenarios exercised overall). Syntax, mobile bundle and native source checks pass. Native compilation, signing and physical-device acceptance were not performed locally.

See the [synthetic demo](demo-v2.98/README.md) and [competitor comparison and roadmap](competitor-review-v2.98.md).
