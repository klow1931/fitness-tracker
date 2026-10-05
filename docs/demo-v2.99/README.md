# v2.99 synthetic walkthrough

All screenshots and histories use synthetic fixtures. These are browser demonstrations at 1280 × 900 and 390 × 844, not physical-device acceptance or measured athlete outcomes. Tall dialogs scroll; screenshots show the visible viewport.

| Flow | What was exercised | Desktop | Mobile |
| --- | --- | --- | --- |
| Guided muscle growth | Reuse goal/days/time; select three exact identities; create editable slots with blank loads and unchecked confirmations; review every week; save, separately schedule and reload. | [Setup](desktop-guided-growth.png) | [Setup](mobile-guided-growth.png) |
| Guided Olympic lifting | Reuse matching sport context; select technical and strength identities; keep loads, exact variation, stop protocols, adult/coaching confirmations and reported named coach review explicit. | [Setup](desktop-guided-weightlifting.png) | [Setup](mobile-guided-weightlifting.png) |
| Guided athlete support | Choose the quality-drill category and exact drill/strength identities; retain separate outcomes and explicit distance/protocol inputs. Existing planner regressions cover actual drill recording and strength effort gaps. | [Setup](desktop-guided-athlete.png) | [Setup](mobile-guided-athlete.png) |
| Repeated approved progression | Accept 60 → 65 kg; collect two new exact-revision sessions; preview and accept 65 → 70 kg; reload with both approvals, frozen 60 kg starting config and unchanged actual workout loads. | [Second preview](desktop-second-progression-preview.png) | [Second preview](mobile-second-progression-preview.png) |

Validation before publishing:

- All 139 Node test files pass, including two approval cycles, stale/altered evidence, shared-session multi-exercise revisions, protected weeks, exact follow-up attribution and sync preservation.
- 56 focused desktop/mobile scenarios pass across guided setup, hypertrophy, sport planners, coaching reviews and Home training. A final 18-scenario run passes the new guided/progression flows plus mobile accessibility (64 unique local browser scenarios across those runs).
- Syntax, mobile bundle and unsigned native source checks pass. GitHub runs the complete 538-scenario browser suite and unsigned iOS/Android compilation on the PR.
- Screenshot inspection found vertically separated checkbox labels; dialog labels now align checkboxes with their text. Overflow, keyboard/accessibility, persistence failure/retry, explicit save/schedule boundaries and the v2.98 delayed-save Home regression are covered by the browser checks.

Reproduce with `npm test` and `npx playwright test tests/browser/guided-progression.spec.js tests/browser/hypertrophy-builder.spec.js tests/browser/sport-planner.spec.js tests/browser/coaching-review.spec.js tests/browser/today-training.spec.js` after installing Playwright Chromium. The local run used the supplied Chromium executable; CI installs Playwright's Chromium.

The structures are authored by Loadnote and remain editable scaffolds. Specialist human-authored templates, automatic sport dosing, signed builds and physical-device beta acceptance remain separate work. No claim of superior training outcomes or individualized learned dose is made.
