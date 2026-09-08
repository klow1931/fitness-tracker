# v1.2.1 verification

## Automated checks

Authoring result: all 16 Node test files and JavaScript syntax checks passed. Playwright discovered all eight cases (four behaviors across two viewports). An execution attempt stopped at browser launch because the Chromium executable was absent; no browser pass is claimed.

The Node suite covers existing training rules and new draft migration, malformed drafts, escaped history text/IDs, storage snapshots, fallback, queued writes, recovery after failure, and workout save-path behavior. Syntax checks include the new modules, test scripts, and browser configuration.

The included browser suite targets desktop and 390px mobile Chromium. It covers draft refresh/checkmarks, UUID history actions, inert exercise-name HTML, overwrite confirmation and blank historical RPE, invalid RPE, and kg/lb conversion. It stubs external chart/CDN scripts for deterministic behavioral tests, and disables service workers. It is not visual or offline verification.

## Checks still required

- Run the GitHub workflow after committing this package, or run Playwright locally. Browser execution was unavailable in the authoring environment (no Chromium executable).
- Verify real CDN styling, dark mode, Gym mode, and touch controls on an iPhone and desktop browser.
- Refresh v1.2 drafts with and without checkboxes, including cardio and timed holds; confirm units and program linkage survive migration.
- Test genuine IndexedDB transaction failure and localStorage quota exhaustion in a browser; confirm the error banner and exported recovery data.
- Test a real upgrade with the service worker enabled; verify new scripts replace old cached versions.
- Run historical numeric-ID and newly saved UUID-ID Template/Delete actions, and delete an auto-generated PR.
- Export a backup before import/replacement tests. Confirm failed imports do not report success.

See archived v1.2 notes for the broader logger acceptance checklist. Passing Node tests alone does not establish browser readiness.
