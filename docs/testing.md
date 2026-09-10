# Verification guide

## Required checks

Run `npm test` and `npm run check`, then the full `npm run test:browser` suite before merging. GitHub Actions installs Chromium and runs these commands on pushes and pull requests. Check the run for the actual proposed commit; an older passing run does not validate newer changes.

The Node suite covers training and nutrition rules, drafts, unit conversion, session edits and PR reconciliation, persistence failures, release consistency and module boundaries.

Browser coverage includes workout/review/edit/reload flows, templates, history pagination/comparison/deletion, navigation, nutrition, measurements and More pages, Focus mode, timer recovery, dashboard signal guards, and light/night coach-link contrast. Projects target desktop and 390px mobile Chromium.

## Test limits

The browser suite stubs external Chart/CDN scripts and disables service workers. Passing it does not verify real chart rendering, production Tailwind styling, offline cache updates, physical touch hardware or iOS Safari. Selected layout/contrast assertions are not a full visual audit.

Local Chromium installation can fail because of network/download issues. Record such runs as blocked, not application failures or browser passes; GitHub Actions can provide an independent execution environment.

## Manual acceptance

- Test the deployed build with real charts and styles in desktop and iPhone Safari, including night mode and Gym mode.
- Confirm review/rest controls stay in normal page flow and coach quick links remain readable and clickable.
- Log, review, save, edit and reload a workout; verify history identity, notes, completion and units.
- Exercise chart metrics/ranges and compare estimates for the same logged set.
- Verify rest pause/resume, expiry and refresh recovery.
- Test nutrition edits, direct portions and real-camera barcode lookup; review package values before accepting refreshed food data.
- Test an upgrade with service workers enabled, then reload online/offline. Check that the new version and scripts replace the cached build.
- Export a backup before import/replacement tests. Check quota/transaction failures and verify recovery exports without claiming a save succeeded.

## Historical results

Earlier release-time execution notes described the tests available then. Current coverage is defined by the repository suite and its commit-specific Actions results. Historical source and setup notes remain under `docs/archive/` and `dev-archive/`.
