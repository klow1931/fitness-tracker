# Loadnote

**v1.2.1 · Development build.** An adaptive strength-training log that learns how you train.

## Run locally

Install Node.js 22, then run `npm run serve` and open `http://127.0.0.1:8000`.
The core static app and Node checks do not require dependency installation.
Charts and utility styling still load from third-party CDNs, so a network connection is needed for the full interface.

## Checks

- `npm test` — all Node unit and integration test files.
- `npm run check` — syntax checks for production code, scripts, and tests.
- `npm install --ignore-scripts` — install the declared development/native dependencies.
- `npx playwright install chromium` — install the browser used for regression tests.
- `npm run test:browser` — desktop and mobile-viewport Chromium checks.

The browser tests stub chart/CDN scripts and test logger behavior, not production visual fidelity. Service workers are disabled in that suite; offline/update behavior requires separate manual checks. Mobile Chromium is not a substitute for iOS Safari testing.

## Update your GitHub repository

Commit the **contents** of this package at the existing app root, including `.github/workflows/test.yml` and `.gitignore`; uploading only the ZIP will not install the workflow. Review your working tree first and preserve unrelated files. Historical root README/changelog files have moved to `docs/archive`; remove obsolete root copies only after confirming their archived versions are present. No repository changes or workflow runs have been made on your behalf.

The included workflow runs checks on pushes and pull requests with read-only repository permissions. It does not deploy the app or use secrets. On failure it retains the browser report for seven days. Once dependencies can be installed, commit the generated `package-lock.json` and switch the workflow to `npm ci` for locked installs; this package does not fabricate a lockfile.

## Project map

| Location | Purpose |
| --- | --- |
| `index.html`, `styles.css` | App shell and styling |
| `app.js` | Legacy orchestration; refactor incrementally |
| `src/product/` | Draft model, logger UI, persistence, history rendering |
| `src/core/`, `src/training/`, `src/coach/` | Existing training and coaching rules |
| `tests/`, `tests/browser/` | Node regression tests and browser checks |
| `docs/` | Current architecture and testing notes |
| `docs/archive/`, `dev-archive/` | Preserved historical documentation and source |
| `backend/` | Optional coach server; not provided by static hosting |

Native packaging remains experimental; see `docs/archive/README-NATIVE.md`. Do not treat old release READMEs as current setup instructions.

## Data and development status

Existing workout storage keys and history formats are retained. v1.2 positional drafts migrate to named-field drafts on restore. Drafts and history remain on the current browser/device; a GitHub repository does not back up training data. Export JSON before testing upgrades or importing replacement data.

See [CHANGELOG.md](CHANGELOG.md), [testing](docs/testing.md), and [architecture](docs/architecture.md). This is not a public-release sign-off or a comprehensive security audit.
