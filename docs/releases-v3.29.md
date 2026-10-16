# Loadnote v3.29.0 — Training quality and coach corrections

This is a reliability-focused release, not a new autonomous coaching engine.

## Improvements
- Explicit unavailable equipment in a Coach follow-up removes previously selected equipment instead of carrying a forbidden choice into the next draft. Multi-item negatives and "full gym without a barbell" are handled, and strength-plan requests missing barbell access are redirected for review rather than quietly assumed compatible.
- A daily Coach draft now treats exercise role changes and saved-workout history changes as stale review context. The athlete must review again before loading a proposal whose source evidence changed. Existing unsaved-logger, unit, device preference and Calendar guards remain in force.
- Model and browser acceptance cases cover equipment corrections, stale role review, and the training handoff: a Coach draft is a prescription, not completed work. Partial actual logging retains a blank RPE and converts display pounds to internal kilograms once.

## Testing and release boundaries
Run npm run check, npm test, npm run check:mobile, npm run check:native and the complete Playwright suite. CI should validate Chromium phone/desktop, WebKit iPhone emulator, Android beta emulator, iOS compilation and Android compilation. Fix any regressions before merging.

This release has no new training schema or automatic loading/progression policy. Saved history, workout revisions, backups and current plan approvals remain authoritative. No device-human timing improvement, individual training outcome, physical-device compatibility or commercial release is claimed.

## Physical-device quality gate
Use the existing mobile logging benchmark (mobile-acceptance.md) and native device acceptance (native-device-acceptance.md) with disposable data. Capture a real 3-set workout from Start to acknowledged Save on a phone, three trials, separating rest time from active logging. Record taps, keyboard obstruction, undo/correction, draft resume after backgrounding, offline cold launch, external JSON backup/re-import and same-signature update. Block distribution for any reproducible data-loss, backup/restore, keyboard or offline-launch failure. Do not compare timing without the same device and setup as the preceding release.

## Programming evaluation
Use blinded, synthetic beginner/returning/intermediate/advanced fixtures to ask for a full week and multi-week cycle in supported strength and hypertrophy paths. Record request fidelity (weeks/days/minutes/equipment/exclusions), exercise identity, load convention, required user approvals, unsupported-domain redirect, whole-cycle quality-gate result, and whether actual history changes before training. Exercise science review is required before claiming generated programs are individually effective; automated quality gates are structural, not evidence of strength gains.
