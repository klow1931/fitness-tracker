# Loadnote v7.2.0 — History, optional setup and offline repair

Version 7.2.0 · unsigned native build 39200 · schema 34 unchanged.

## Behavior

Explicit Simple view keeps History focused on search and saved sessions. Existing filter and management nodes move into expandable controls; switching to Full view restores them with values and handlers intact. Edit remains prominent, other session actions are grouped, and flagged records/duplicates remain discoverable without opening management. No session, record, filter policy, import/export or deletion behavior is changed.

The starting screen offers kg/lb before the first workout, using `setUnit` and its existing storage conversion. Planning and intake are labeled optional. Competition mapping remains in Advanced setup until a saved powerlifting goal makes it relevant.

Offline warming and repair now save each file independently, with at most four concurrent requests, a 20-second per-request abort, actual cached-file progress and shared repair work. Retrying fetches only missing assets. Readiness still requires every manifest file to exist in the current cache. Retired Loadnote asset-cache cleanup remains separate from training storage. No localStorage, IndexedDB, workout, draft or other app cache is cleared.

Page control is established promptly while cache readiness is reported independently. Startup checks do not label an actively warming cache as a finished failure. Browser offline tests wait for the explicit ready status before disconnecting.

The lifecycle UI distinguishes preparing, ready, partial failure and no-response states. A 45-second inactivity timeout makes repair retryable; progress refreshes it and final status clears it. Waiting application updates retain their separate explicit activation flow.

This fixes a reproducible all-or-nothing repair failure mode; the original review's specific deployed-device/network cause was not established. Physical device and real low-storage acceptance remain required.

## Architecture and rollback

`history-clarity-ui.js` owns presentation grouping and restoration; existing history utilities own filtering, edits, comparisons, import/export and revision integrity. `starting-units-ui.js` only calls the existing unit path. Offline repair stays in the service worker and lifecycle boundary. No storage migration or programming policy changes.

Rollback baseline: merged v7.1 commit `37b5cebd704cb188b0bfcd7d66003445487c4cb0`. This branch is validated before main changes.

## Validation

Node coverage includes independent partial caching, missing-only and concurrent retry, cache-namespace isolation, progress and no-response feedback, and existing save-before-update safeguards. New browser coverage exercises actual pounds logging and reload, retained history filters and actions, visible review flags, optional setup, narrow enlarged text, a real one-file HTTP failure and subsequent offline draft reload with the server stopped. Existing Node/static/mobile/native-source/beta and complete Chromium/WebKit CI suites remain release gates. Native builds remain unsigned; emulation does not establish physical iPhone/Android acceptance.
