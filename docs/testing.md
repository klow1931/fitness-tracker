# Verification guide

## Required checks

Run `npm run check`, `npm test`, `npm run check:mobile`, then the full `npm run test:browser` suite before merging. GitHub Actions installs Chromium and runs these commands on pushes and pull requests. Check the run for the actual proposed commit; an older passing run does not validate newer changes.

The Node suite covers training and nutrition rules, drafts, unit conversion, stable exercise identities, workout revision/undo, recovery snapshots, import previews, block coverage, planned-versus-completed comparisons, decision-readiness mappings and point-in-time evidence, session edits and PR reconciliation, persistence failures, release consistency, mobile runtime detection, sync manifest/conflict planning, account/session signing, CSRF/CORS auth boundaries, persistent account identity, OIDC PKCE/state/nonce/JWKS verification, account-scoped remote snapshot revisions/conflicts/corruption checks, explicit shared-base sync orchestration, first-link safety, recovery-backed cloud application, stale-review rejection, durable account/remote-snapshot deletion, Profile/onboarding behavior, active-program lifecycle ordering, meet-cycle transition handoff, timely/missed review windows, and module boundaries. `npm run check:mobile` rebuilds the consumer `www/` package and verifies its Capacitor configuration, install manifest, safe-area contract, asset completeness and exclusion of server/development directories.

Browser coverage includes workout/review/edit/reload flows, manual and template-sourced prescriptions, deviation context, templates, history pagination/comparison/deletion, navigation, nutrition, measurements and secondary pages, Focus mode, timer recovery, dashboard signal guards, decision-readiness mapping confirmation, active-program lifecycle routing on desktop/mobile, authenticated Coach/CSRF routing, account status/sign-out behavior, explicit account sync, and light/night coach-link contrast. Projects target desktop and 390px mobile Chromium.

## Test limits

Most behavioral tests stub the bundled chart script and disable service workers. The offline suite uses the real bundled styles and Chart.js with service workers enabled, testing draft reload, offline saves/charts and an explicit update with another tab open. These checks do not replace physical touch or iOS Safari verification. Selected layout/contrast assertions are not a full visual audit.

Local Chromium installation can fail because of network/download issues. Record such runs as blocked, not application failures or browser passes; GitHub Actions can provide an independent execution environment.

## Manual acceptance

- Before v1.9 release, test the deployed build in iPhone Safari and Add to Home Screen, including night mode and Gym mode. Check keyboard overlap when entering sets/chat, and confirm all controls can be reached with touch.
- Confirm review/rest controls stay in normal page flow and coach quick links remain readable and clickable.
- Log, review, save, edit and reload a workout; verify history identity, notes, completion and units.
- Exercise chart metrics/ranges and compare estimates for the same logged set.
- Verify rest pause/resume, expiry and refresh recovery.
- Test nutrition edits, direct portions and real-camera barcode lookup; review package values before accepting refreshed food data.
- Test an upgrade with service workers enabled, then reload online/offline. Check that the new version and scripts replace the cached build.
- Export a backup before import/replacement tests. Check quota/transaction failures and verify recovery exports without claiming a save succeeded.
- For commercial backend staging, verify anonymous account access is rejected, authenticated session status is correct, logout clears the cookie, CSRF is required for cookie-authenticated POSTs, and unapproved cross-origin requests are rejected.
- With a staging identity provider, verify OIDC login redirects to the configured issuer, callback creates/reuses the same Loadnote account, a server restart preserves account identity, unverified provider email is not trusted as account email, and sign-in never claims local workouts are already synchronized.
- With staging remote storage enabled, verify a first **Sync now** creates revision 1 and a device shared base; a second device with divergent data and no base requires an explicit starting-copy choice; safe one-sided changes merge; concurrent same-record edits require explicit conflict choices; incoming data creates a recovery snapshot; a cloud change during review forces a fresh sync; another account cannot read the snapshot; and normal workout logging still works offline without signing in or syncing.
- From Profile on a staging authenticated build, verify account deletion requires the explicit destructive confirmation, removes the server account and remote structured-training snapshot, signs the user out, clears this device's sync acknowledgement metadata, and leaves local workout history intact.

## Historical results

Earlier release-time execution notes described the tests available then. Current coverage is defined by the repository suite and its commit-specific Actions results. Historical source and setup notes remain under `docs/archive/` and `dev-archive/`.


### v2.61 lifecycle acceptance

- Run a scheduled reviewed phase program through a phase boundary: unresolved sessions must stay explicit, a review may own the next step only while its future-only change window is open, and a missed window must not block later training.
- Run a flexible meet cycle through a completed week, event day, saved athlete-entered results, transition freeze and next-program handoff. Confirm event attempts never become estimated-capacity or training-max values.
- Confirm Home, Coach and the post-workout recap agree on the same lifecycle next action.
- Confirm overlapping scheduled programs produce a review state rather than an arbitrarily selected active program.
