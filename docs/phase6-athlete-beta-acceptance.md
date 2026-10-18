# Phase 6 — Athlete beta acceptance (v3.58)

**Status:** Engineering candidate only. This document lists human acceptance gates; no automated check can truthfully mark a physical device, real hosted identity provider or athlete study as completed.

## Beta boundaries
- **Native app:** local-only. No account sign-in, cross-device sync, online Coach or voice. App uninstall, clearing storage or changing the application ID can remove workouts. Export and independently verify a JSON backup before every reinstall/test upgrade.
- **Hosted web:** OIDC account + manual, explicit conflict-reviewed sync only when a real backend is configured. Do **not** infer automatic backup from a successful login. Confirm training shows the same record IDs on both devices after each sync.
- **Backend:** atomic file storage is intended for a *single instance* on a persistent disk with independent encrypted, access-controlled volume backups. There is no multi-instance transactional database, hosted production deployment or verified disaster-recovery SLA in this release.
- **Coach:** descriptive logged-data insights, not medical assessments; no unreviewed changes to prescribed work.
- **Consent:** use test accounts and synthetic logs for regression checks. Collect minimal real-athlete feedback with informed consent. Never attach raw athlete JSON, account tokens, medical history, photos or credentials to public GitHub issues/CI artifacts.

## Required physical-device acceptance
For each Android and iPhone device, record: date, build SHA, app ID, phone model, OS version, tester pseudonym, actual steps, observed outcome, pass/fail, severity, and anonymized reproduction instructions.

| Test | Minimum demonstrated result |
| --- | --- |
| First launch, offline cold-start and low storage | No blank screen; saving failures visible and recoverable |
| In-set logger / decimal keyboard / RPE | Large controls; save sets in under a few touches; completed set history survives app kill and relaunch |
| Internal kg/display lb | Toggle units, edit loads, close and reopen; kilograms remain canonical internally |
| Scheduled training / Phase 5 | Selected program, next action, review windows and accepted adaptations match recorded state; no surprise program writes |
| Backup/restore and cancellation | Save JSON to actual Files destination, inspect its verified manifest; restore to a clean test install; cancelling share does not mark a backup complete |
| Recovery under interruptions | Force-close mid-draft, lose connectivity mid-sync, sign out during sync, quit during persistence; no silent last-write-wins or invented completion |
| Browser cross-device sync | Test first-link explicit choice, distinct workout additions, same-workout divergent edits, remote revision race and account deletion |
| Accessibility | TalkBack and VoiceOver on small screen; keyboard focus, targets, high text scaling and contrast |
| Privacy/security | Confirm no raw workouts in logs or links; server-side secrets only; permission manifests and provider data-retention policies reviewed |
| Android release | Confirm signing, Play Console package identity, target SDK/policy requirements, internal testing, crash review and uninstall behavior |
| iOS release | Confirm owned signing team, App Store Connect privacy disclosures, TestFlight external review where applicable, device build and recovery |

## Beta participants and operational process
1. Begin with a small closed pilot (suggest 5–10 athletes of varied experience, including a new lifter and an experienced lifter); expand only after the first week contains no critical data-loss or blocked logging incidents.
2. Each participant completes first-run setup, three workout logs, one edit or correction, one next-workout review, one offline session and a verified export/restore practice using a test copy.
3. Record **time to first logged set**, tap errors, crashes, missing/surprising fields, persistence failures, and misunderstood Coach answers. Compare program recommendations against actual logs and accepted training rules, not perceived conversational fluency alone.
4. Escalation: **P0** data loss, cross-account disclosure, silent schedule replacement or unreviewed program changes — stop rollout and preserve private diagnostic evidence. **P1** blocked workout saving / bad kg-lb display / unusable backup — suspend affected platform. Less severe issues are triaged for future patches.
5. Back up before testing updates, rehearse restoring to a separate sandbox, and maintain a known-good v3.53 rollback. Public issue reports should omit training exports or identifiers.
6. Authorize wider athlete testing and store submissions only after signing, hosting, disclosure, device, accessibility and retention gates are independently completed. No current claim that an athlete study or production audit has passed.

## Single-instance production hosting checklist (manual)
- Provision and back up an encrypted persistent filesystem. Configure explicit `LOADNOTE_ACCOUNT_STORE_PATH`, `LOADNOTE_SYNC_STORE_PATH`, and `LOADNOTE_SESSION_REVOCATIONS_PATH` on that volume.
- Configure `LOADNOTE_AUTH_SECRET` (server-side only), approved HTTPS OIDC issuer and callback, cookie security and permitted origins. Never distribute API keys or signing secrets in client bundles or CI logs.
- Run exactly one API writer instance with the file adapter. Multiple replicas, network file shares and serverless ephemeral disks require a replacement transactional account+sync store. File fsync and compare-and-swap in one process do not establish distributed transactions.
- Verify server restart and backup/restore on a staging environment, including identity mapping, account removal, revision conflicts and actual restored workouts. Exercise emergency revocation and deletion procedures.
- Complete legal/privacy and data-retention review, service health/alerting and platform-level incident response before opening account sync to a wider cohort.

## Engineering evidence and unclaimed gates
Run `npm run check:beta`, `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native`, all browser/WebKit suites, Android emulator acceptance, and Android/iOS compilation. The scripted source gate checks code and native local-only boundaries **only**. It cannot sign an app, validate a real storage backup, certify privacy compliance or substitute for a field trial.
