# Loadnote v7.8.1 — Reliable Simple Home controls

Version7.8.1 · unsigned native build39801 · schema34.

The onboarding Keep Home simple checkbox now applies and persists its value immediately, without requiring a start-path selection. Profile's Simple Home control updates its On/Off and pressed state in place, retaining the same button/focus rather than rebuilding Profile during activation. It has an explicit accessible name/help and a stable minimum44px target. Both controls use the existing device-local preference writer and roll back honestly if storage fails. Entry choice, workout draft, units, history and programming remain unchanged.

Confirmed source/behavior findings: the prior checkbox had no change handler; a new behavior test failed against7.8.0. After wiring the checkbox, the focus test independently failed because Profile was replaced. Both pass after the fix. These findings are not proof that they explain every physical-iPhone symptom; actual phone/VoiceOver acceptance remains unverified.

Added real touch, keyboard/focus, reload, denied-storage and narrow enlarged-text browser journeys selected for both weekly mobile profiles. Full Node/static/release/packaging and exact-head browser/native/emulator/security results are recorded in PR/tracker. Local browser execution was previously blocked before page load by socketEPERM; no local interaction pass is invented.

No data migration, training-engine or online/model changes. Same preference key/shape. Rollback baseline: approved merged v7.8.0/build39800, mainff576ef72054693cad58fab9bfcba031ded13734; preserve backups and restore the release as a whole if required. v7.8.1 is not live until checked, merged and published through the guarded workflow, with settled double asset verification.
