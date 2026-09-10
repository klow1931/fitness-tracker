# Loadnote

**v1.8.1 · Development build.** A local-first strength-training log with workout review, progress tracking, nutrition and coaching.

## Current features

- Log strength, timed holds and cardio. Review before saving; edit saved sessions without changing their identity.
- Restore unfinished drafts, reorder exercises, use Focus mode and run a rest timer with pause/resume and refresh recovery. Review and timer controls stay in the page.
- Browse paginated history, filter dates, compare workouts and chart exercise progress. Strength charts include optional RPE in estimated 1RM, matching the training dashboard.
- Track food portions, edit entries, review barcode refreshes and mark complete nutrition days.
- View weekly activity, measurements, records, photos and training recommendations. Fatigue scoring waits for sufficient history; plateau signals require multiple sessions.
- Use coach insights, chat and suggested questions with light/night-mode styling.

## Run locally

Use Node.js 22. Run `npm run serve` and open `http://127.0.0.1:8000`.
The static app and Node checks do not require dependency installation.
Charts and utility styling load from third-party CDNs; full offline behavior is not guaranteed.

## Checks

- `npm test` — Node unit and integration tests.
- `npm run check` — production, script and test JavaScript syntax.
- `npm install --ignore-scripts`, then `npx playwright install chromium` — browser-test dependencies.
- `npm run test:browser` — desktop and mobile-viewport Chromium regressions.

Browser tests stub external chart/CDN scripts and disable service workers. They cover behavior and selected layout/contrast checks, not full production rendering, offline behavior or iOS Safari. See [testing](docs/testing.md).

## Repository and releases

Develop changes on a branch and open a pull request. The read-only GitHub Actions test workflow runs on pushes and PRs; it does not deploy. Review checks before merging. GitHub Pages serves the static app; the optional coach backend requires separate hosting.

`package.json` is the release-version reference. Update the release helper, app footer, service-worker cache, README and newest changelog entry together. Tests reject disagreement. Keep historical changelog entries and archived documents at their original versions. A branch name does not define the app version.

Dependencies currently use `npm install`; reproducible lockfile-based installs remain follow-up work.

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

Workouts and drafts remain on the current browser/device. GitHub stores app code, not training-data backups. Export JSON before replacement imports or upgrade testing. This release does not migrate saved workout data or change schema version 10.

See [CHANGELOG.md](CHANGELOG.md) and [architecture](docs/architecture.md). Automated checks are not a public-release sign-off or a comprehensive security audit.
