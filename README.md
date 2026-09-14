# Loadnote

**v1.14.0 · Development build.** A local-first strength-training log with workout review, progress tracking, nutrition and coaching.

## Training Prescription & Session Intent

v1.14 adds **This week** on Home and **Scheduled sessions** in Calendar. Schedule a captured template/program/logger plan, start its linked draft, and explicitly reschedule, skip or cancel. Overdue sessions without a workout stay unconfirmed. See [scheduling and adherence definitions](docs/scheduling.md).

The workout logger can record a session role, goal and an immutable snapshot of planned sets separately from completed performance. Templates, repeated workouts and generated program days capture their loaded work automatically; a manual session can use **Use entered work as plan** before training. If execution changes, record the reason without rewriting the original plan.

History, block analysis and Decision Readiness now report planned-session coverage and planned-set completion. Missing planned work remains unknown rather than being treated as nonadherence. Loadnote still does not make or apply training decisions. See [the prescription contract](docs/session-intent.md).

## Athlete Model & Decision Readiness

Coach → Programs now includes a per-lift Decision Readiness panel. Confirm competition lifts and variation relationships, inspect an explicit analysis date, and compare logged load, RPE-aware estimated capacity, block training maxes, known 1RMs and legacy profile benchmarks without collapsing them into one “max.” Current-corrected analysis supports historical context entered later; Historical as-recorded replay withholds block and role knowledge that was not yet recorded and flags legacy timestamp limits.

v1.13 reports evidence quality and execution context only. It does not automatically change loads, prescribe deloads or enable the v2 decision engine. See [the evidence contract](docs/decision-readiness.md).

## Training Data Integrity

Schema 12 assigns stable identities to exercises without rewriting the labels in saved workouts. Compact spelling variants are linked automatically; Tools → Exercise identities & aliases can merge semantic aliases such as “Adduction Machine” and “Hip Adduction.” Analysis and previous-session lookup follow the stable identity.

Workout edits and deletions retain bounded revision snapshots with History-level undo. Duplicate creates a new draft instead of editing the source session. Imports show added/changed/removed record counts and save a local recovery snapshot before replacement; exported backups omit nested recovery payloads to stay portable.

## Training Block Context

Under Workouts, open Training Block Context to add a current or historical date range. Block dates are inclusive; open-ended blocks must end before a later block begins. Optional training maxes are programming choices, while known 1RMs are athlete-reported benchmarks. Both store kg and a known-on date. Neither becomes a capacity estimate.

Block analysis is explicitly retrospective and filters workouts through the analysis date. Three distinct performance days with usable reps and RPE are required for estimated-capacity trends. Prescription coverage and planned-set completion appear only where planned-session evidence exists. See [block API and backtesting](docs/training-blocks.md).

## Current features

- Log strength, timed holds and cardio. Review before saving; edit with revision-backed undo or duplicate a session into a new draft.
- Restore unfinished drafts, reorder exercises, use Focus mode and run a rest timer with pause/resume and refresh recovery. Review and timer controls stay in the page.
- Browse paginated history, filter dates, compare workouts and chart exercise progress. Strength charts include optional RPE in estimated 1RM, matching the training dashboard.
- Track food portions, edit entries, review barcode refreshes and mark complete nutrition days.
- View weekly activity, measurements, records, photos and training recommendations. Fatigue scoring waits for sufficient history; plateau signals require multiple sessions.
- Use coach insights, chat and suggested questions with light/night-mode styling.

## Run locally

Use Node.js 22. Run `npm run serve` and open `http://127.0.0.1:8000`.
The static app and Node checks do not require dependency installation.
Styles and charts ship with the app. After the first online load completes offline setup, workouts, history, timers and charts can be used offline. Online coaching and food lookup still require internet.

## Checks

- `npm test` — Node unit and integration tests.
- `npm run check` — production, script and test JavaScript syntax.
- `npm install --ignore-scripts`, then `npx playwright install chromium` — browser-test dependencies.
- `npm run test:browser` — desktop and mobile-viewport Chromium regressions.

Most behavioral tests stub charts and disable service workers. The offline suite uses real bundled assets and enabled service workers. They cover behavior and selected layout/contrast checks, not full production rendering, offline behavior or iOS Safari. See [testing](docs/testing.md).

## Repository and releases

Develop changes on a branch and open a pull request. The read-only GitHub Actions test workflow runs on pushes and PRs; it does not deploy. Review checks before merging. GitHub Pages serves the static app; the optional coach backend requires separate hosting.

`package.json` is the release-version reference. Update the release helper, app footer, service-worker cache, README and newest changelog entry together. Tests reject disagreement. Keep historical changelog entries and archived documents at their original versions. A branch name does not define the app version.

Use `npm ci` for locked installs and `npm run build:assets` to regenerate committed styles and charts. Updates wait for Save and update; drafts and data must save first. Close other Loadnote tabs before applying an update.

## Project map

| Location | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `energy.css` | App shell and shared visual system |
| `app.js` | Startup and remaining dashboard, coaching, program and feature orchestration |
| `src/product/` | Workout, nutrition, navigation, history/progress, drafts, timers and persistence |
| `src/core/`, `src/training/`, `src/coach/` | Shared data rules, training models and coaching |
| `tests/`, `tests/browser/` | Node and desktop/mobile Chromium regressions |
| `docs/` | Current architecture and testing guidance |
| `docs/archive/`, `dev-archive/` | Historical documentation and source |
| `backend/` | Optional coach server; not supplied by static hosting |

Native packaging remains experimental; see `docs/archive/README-NATIVE.md`.

## Data and development status

Workouts and drafts remain on the current browser/device. GitHub stores app code, not training-data backups. Export JSON before replacement imports or upgrade testing. Schema 14 adds optional session-intent and planned-work snapshots without rewriting older workouts, sets, dates or loads.

See [CHANGELOG.md](CHANGELOG.md) and [architecture](docs/architecture.md). Automated checks are not a public-release sign-off or a comprehensive security audit.
