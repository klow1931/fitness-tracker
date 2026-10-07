# v3.10 feature demo and acceptance matrix

Use isolated synthetic records, never overwrite an athlete's live account or import personal backups into CI. The full browser suite runs each spec in desktop and mobile Chromium; a fresh destination walkthrough captures 20 theme/destination screenshots per project at 390px, checks 320/390/430px overflow and verifies navigation does not mutate training.

| Area | Demo/regression coverage |
| --- | --- |
| Home / Today | `today-training`, `fast-start`, `adaptive-handoff`, `feature-demo` |
| Active workout, load/reps/RPE, rest, undo | `training-loop`, `logger`, `gym-floor`, `clear-coaching`, `training-flow`, `session-timing` |
| History, revisions, duplicates, units | `history-reliability`, `data-integrity`, `history-cleanup`, `progress`, `training-loop` |
| Profile, intake, roles, preferences | `profile`, `workflow-polish`, `profile-uniformity`, `athlete-planning`, `decision-readiness` |
| Program build, meet date, styles, accessories | `meet-prep-setup`, `phase-builder`, `meet-cycle`, `accessory-programming`, `program-workout-viewer` |
| Reviews, future changes, cancellation, event/handoff | `program-review`, `cycle-review`, `cycle-response`, `mock-meet`, `v3-coaching`, `program-lifecycle` |
| Hypertrophy, sport, weightlifting, cardio | `hypertrophy-builder`, `sport-training`, `sport-planner`, `athlete-planning` |
| Coach / Companion | `coach-conversation`, `coach-companion`, `local-companion-ai`, `secure-coach`, `coach-voice` |
| Progress / goals / records | `progress`, `training-review`, `athlete-goals`, `program-outcomes`, `more` |
| Calendar / nutrition / measurements / photos / calculators | `schedule`, `nutrition`, `measurements`, `more`, `feature-demo` |
| JSON backup/restore, interrupted storage, offline/update | `history-reliability`, `mobile-reliability`, `native-restore`, `offline`, plus Node transfer/persistence tests |
| Account and manual sync | `account-session`, `account-sync`, `sync`, plus backend Node tests (synthetic/mocked services) |
| Accessibility and small-screen layout | `mobile-accessibility`, `navigation`, `mobile-layout`, `mobile-usability`, `feature-demo` |
| Native packaging | mobile/native source checks and unsigned Android/iOS cloud compilation; mocked bridges do not establish hardware behavior |

## Findings included in this update

- README static-server command referenced a nonexistent npm script; corrected to `node scripts/serve.js`.
- Current-state README schema and native guidance were stale; historical notes are labeled and current schema 32, navigation, consent/service and unsigned-beta limitations are explicit.
- Architecture incorrectly described the decision engine as disabled; corrected its boundary without changing decision logic.
- Meet timeline style display would call the new weekly option linear; it now names the saved weekly style, with a handoff regression.
- Weekly style explanations separate phase structure from loading and describe progression per pair. Legacy plans remain unchanged.
- Base-step field labels now follow the selected style (weekly, per wave or per two-week pair), avoiding a misleading weekly label on nonweekly progression. Selected evidence-audit steps are described as base steps rather than falsely labeled per week.
- The fresh full-product demo reproduced 320px Train overflow: the seven-column logger minimum widths exceeded the card. A scoped two-row layout retains numeric entry, completion and removal without clipping. The demo compares against the requested viewport width (not an expanded mobile `innerWidth`) and waits for layout stabilization.

## Validation status

Local browser installation failed because the downloaded Chromium archive was invalid. No local visual/browser pass is claimed. GitHub Actions runs the full browser suite and whole-product demo artifacts instead. Local syntax, complete Node tests and mobile/native packaging results and final CI run are recorded in the pull request.

Passing mocks and viewport tests do not demonstrate physical iPhone/Safari keyboard clearance, background/lock/resume behavior, native file sharing, real WebGPU model compatibility/quality, live account/cloud/voice integrations or store readiness. These stay open under `mobile-acceptance.md` and `native-device-acceptance.md`. The matrix covers feature families, not every possible data/device configuration.
