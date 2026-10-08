# Guided training / native beta acceptance

## Release scope

v3.19 is the first guided-training slice: shared journey, library discovery and safe adjustment handoffs. Do not equate this with completion of the full store roadmap. Native state remains unsigned development and local-only.

## Automated athlete scenarios

Use synthetic records in isolated browser profiles, never an athlete's real history.

| Scenario | Required behavior |
| --- | --- |
| New lifter | Save actual availability/equipment, see progress, reach supported planner; no account or automatic program required |
| Independent lifter | Log actual work without generating a plan |
| Interrupted session | Reload and resume exact actual load/RPE; finish and save while offline; verify durable save on reload |
| Meet-cycle athlete | Home/Coach/Decisions show the same review; opening evidence never changes targets |
| Missing weekly effort | Missing evidence stays unknown; no inferred completion |
| Two overlapping programs | Explicit program selection; no combined review |
| Equipment changed | Reach reviewed session editor; fresh targets and approval still required |
| Library discovery | Search aliases, filter equipment/role, preserve unknown custom equipment and exact-name guidance limits |
| Accessibility/layout | Keyboard focus through filtering and dismissal; 320px light/dark and enlarged text screenshots |

Run `npx playwright test tests/browser/athlete-journey.spec.js` plus existing logger, profile, weekly coaching, adaptive-session, program-edit and native acceptance regressions. The CI `athlete-journey-demo` artifact retains screenshots and failure traces. Assertions use real DOM interactions for setup and workout entry; synthetic fixtures are used only where weeks of training are needed.

These tests simulate athlete workflows, not physiological training results. Chromium mobile emulation does not prove iOS/Android WebView, VoiceOver/TalkBack, native background behavior or on-device model performance.

## Remaining big-update work

1. Consolidate duplicate entry points after observing beta athletes; expand first-plan guidance where unaided testing shows confusion.
2. Validate session-adjustment usefulness with real equipment/time constraints; do not claim alternatives are dose-equivalent.
3. Refine readable multi-week progress using corrected observations; no causal attribution or promised results.
4. Confirm production identifiers, developer-account ownership and approved signing secrets. Use cloud macOS builds if no Mac is available. Do not commit keys or mark unsigned binaries as store ready.
5. Distribute signed TestFlight and Play test builds after setup. Run the physical-device matrix in `native-device-acceptance.md`, including background, locked screen, interrupted saves, upgrades, external restore and accessibility.
6. Review support/privacy pages and actual native data flows, store disclosures, enabled account-deletion routes, platform requirements and applicable Play testing requirements before submission.
7. Recruit an initial strength/powerlifting beta cohort, collect unaided first-session completion, repeat use and support failures. Decide pricing from observed value; subscriptions are not enabled by this release.

Do not ship with unresolved data-loss, restore, keyboard obstruction or native offline-launch defects. Signed distribution and service credentials require owner setup and approval; this document does not provision them.
