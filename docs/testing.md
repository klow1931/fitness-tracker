# Verification guide

## Required checks

Run `npm run check`, `npm test`, `npm run check:mobile`, then the full `npm run test:browser` suite before merging. GitHub Actions installs Chromium and runs these commands on pushes and pull requests. Check the run for the actual proposed commit; an older passing run does not validate newer changes.

The Node suite covers training and nutrition rules, drafts, unit conversion, stable exercise identities, workout revision/undo, recovery snapshots, import previews, block coverage, planned-versus-completed comparisons, decision-readiness mappings and point-in-time evidence, session edits and PR reconciliation, persistence failures, release consistency, mobile runtime detection, sync manifest/conflict planning, account/session signing, CSRF/CORS auth boundaries, persistent account identity, OIDC PKCE/state/nonce/JWKS verification, account-scoped remote snapshot revisions/conflicts/corruption checks, explicit shared-base sync orchestration, first-link safety, recovery-backed cloud application, stale-review rejection, durable account/remote-snapshot deletion, Profile/onboarding behavior, active-program lifecycle ordering, meet-cycle transition handoff, timely/missed review windows, starting-prescription evidence/audit behavior, phase-specific cycle decision policy and transition guards, frozen cycle-controller recommendation/replay behavior, null-vs-zero decision regressions, gym-floor helper behavior, secure Coach gateway/client behavior, provider-secret isolation, and module boundaries. `npm run check:mobile` rebuilds the consumer `www/` package and verifies its Capacitor configuration, install manifest, safe-area contract, asset completeness and exclusion of server/development directories.

Browser coverage includes workout/review/edit/reload flows, manual and template-sourced prescriptions, deviation context, templates, history pagination/comparison/deletion, navigation, nutrition, measurements and secondary pages, Focus mode, timer recovery, previous-set reuse, mobile current-set progression, one-handed workout controls, destructive-action protection, offline local save, dashboard signal guards, decision-readiness mapping confirmation, active-program lifecycle routing on desktop/mobile, authenticated Coach/CSRF routing, account status/sign-out behavior, explicit account sync, secure Coach request-shape/fallback behavior, evidence-backed starting-prescription application/snapshot persistence, frozen weekly-controller snapshots, athlete override preservation, derived Cycle Journal rendering/outcome lineage, and light/night coach-link contrast. Projects target desktop and 390px mobile Chromium.

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


### v2.62 gym-floor acceptance

- On a 390px viewport, start or resume a real workout and verify load/reps/RPE entry, quick RPE completion, next-set focus, rest timing and Finish are reachable without horizontal overflow.
- Verify previous-set context reflects the latest matching exercise/tracking mode, respects kg/lb display conversion, and **Use last** copies only load plus reps/hold duration — never previous RPE or completion.
- Background/suspend or reload an unfinished workout and confirm the local draft and rest timer recover without duplicating a saved workout.
- Navigate away from Train with an unfinished draft and back again; confirm the draft remains intact and the mobile Train indicator clears only after the workout is cleared/saved.
- With the app already loaded, take the browser/device offline and confirm review + local workout save still succeeds.
- Confirm a stray remove tap cannot delete a nonblank entered set/exercise without the destructive confirmation, while blank rows remain quick to remove.
- Manually validate iOS/Android numeric keyboard behavior and visual-viewport handling on physical devices; Chromium emulation does not prove native keyboard geometry.


### v2.63 secure Coach acceptance

- Verify production online Coach rejects anonymous requests and cookie-authenticated POSTs without CSRF.
- Verify the browser sends only `question`, bounded `history`, and structured `context`; raw provider message arrays, API keys, models, providers, custom base URLs and client system prompts must be rejected before any upstream request.
- Verify the trusted system prompt is generated server-side and explicitly treats athlete context as untrusted data rather than instructions.
- Verify provider credentials never appear in browser storage, request bodies, API responses, public health output, or the mobile `www/` bundle. Historical browser Coach keys should be removed on upgrade.
- Verify all off-device training weights are explicitly labeled kilograms and AI recommendation load is `weightKg`; UI display conversion remains separate.
- Verify malformed/empty provider responses are rejected server-side and do not reach the browser as raw provider payloads.
- Verify signed-out and provider-unavailable flows retain deterministic built-in Coach guidance without modifying workouts/programs.
- On staging, verify provider timeout/error responses are normalized and do not expose provider payloads or secrets.


### v2.66 cycle-observability acceptance

- Save a v2.66 weekly meet-cycle review and confirm the stored controller snapshot contains the exact review cutoff, release/schema/policy environment, input fingerprint and displayed recommendation fingerprint.
- Override one displayed controller recommendation manually and confirm the saved controller recommendation remains unchanged while the athlete choice records the override.
- Replay a saved controller snapshot from its frozen inputs and require an exact recommendation fingerprint match on the release under test.
- Add future workout data after an earlier journal cutoff and confirm the historical journal view does not change.
- Attribute later competition-lift evidence only when workout → scheduled-session → exact Calendar revision → captured prescription lineage is auditable. Later/manual prescription changes must become revised/deviated rather than a clean observed outcome.
- Confirm `null`/missing capacity change and RPE remain unknown through next-block objective logic and cannot be interpreted as 0% change or RPE 0.
- Confirm legacy phase programs, meet cycles and v1–v4 weekly reviews remain valid; missing observability metadata should appear as a warning rather than corrupting the historical training record.
- Verify the Cycle Journal can show an upcoming scheduled cycle before its start date and remains free of horizontal overflow on the 390px browser project.
