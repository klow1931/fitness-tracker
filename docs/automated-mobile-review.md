# Automated mobile review

Open **Actions → Loadnote mobile review → Summary** to compare the Android-style Chromium and iPhone-style WebKit results for the same Loadnote version. The workflow runs on pull requests and, once merged, weekly on Mondays at 12:23 UTC. Use **Run workflow** for an on-demand review.

The summary groups existing beginner journeys by review area and flags failures and tests that passed on retry. The **loadnote-mobile-review** artifact includes the HTML report, a Markdown copy of the mobile comparison, screenshots where captured, and available failure traces. Update and draft-protection checks appear separately in the run summary because they test service worker and application logic rather than an installed phone.

The Markdown comparison now records the source commit, actual tested checkout
commit, tracked-change status, native build number and configured base target.
For PR runs, source identifies the PR head while tested checkout identifies GitHub's
synthetic merge; local runs fall back to the actual checkout. Missing or malformed
provenance is shown as unavailable. A dirty checkout is explicitly flagged because
the commit alone cannot reproduce its results. Worker/update scenarios use dedicated
loopback origins recorded in their individual steps, rather than the base target.

The grouped report covers served-build browser profiles. It does not certify the
published site, physical phones or the separate offline step. Even a green regular
review requires inspecting the later offline step and its retained report/traces;
missing, failed or cancelled offline evidence is never inferred to pass. The
Markdown links to the separate offline HTML report in the combined artifact.

For a confirmed failure, record the version, browser profile, scenario, reproduction steps, and impact in the review backlog. Prioritize interrupted workout logging, draft loss, and inaccessible controls. Compare the same scenario after the fix.

The offline/update area also runs a real waiting-worker upgrade with unfinished kg and lb entries, an offline reload, and a fresh live-version check with a deliberately stale cached manifest. These use a dedicated local origin. Pages separately checks the actual published release and every app/offline asset after deployment; see [v7.7 release preparation](releases-v7.7.md).

Scheduled and manual reviews on main additionally verify the current live release and every manifest asset. PRs do not compare unpublished assets to production. A failure in this step is a deployment finding, separate from browser journey results. The publication workflow checks that Pages uses a single GitHub Actions publisher before deploying; see [publisher recovery](pages-publisher-recovery.md).

The verified-history/adaptation area selects the existing v64, v4, v41 and v42 journeys in both mobile profiles. It checks exact-identity confirmed performance, kg/lb display separation, exclusion of same-day/unconfirmed/ambiguous history, comparable RPE and unknown effort, prescription chronology, next-session evidence and unfinished-draft priority. The assertions preserve saved records and avoid silently changing future plans. This is evidence of those specific scenarios, not a claim that every adaptation or real athlete outcome has been validated.

A Node coverage gate runs Playwright discovery without launching browsers to ensure those scenarios remain selected in both profiles. It also exercises the grouped reporter with synthetic pass/retry/failure/skipped results, so missing or flaky evidence is not presented as a clean pass. Browser execution remains a separate required gate. The workflow also repeats the existing update journeys three times in both profiles with retries disabled before the complete review.

This provenance update retains v7.11.0/build40100/schema34 and its unchanged
328-asset manifest; it does not change runtime assets, native builds or training
data. Rollback source baseline is approved main
`9743c771698b79e45b96e4aea7632bbd211629d2`; reverting this reporting change
does not repair live hosting. Keep live/offline recovery and physical-device
acceptance separate.

The review uses synthetic workouts and deterministic research fixtures. Offline Coach scenarios exercise local answers without downloading an LLM. Internet-enabled research paths use controlled responses. Physical keyboards, touch ergonomics, screen readers, installation, and real low-storage behavior remain separate device checks.

The weekly/manual review also runs the existing required offline workout journey
after the regular mobile review. It waits for real worker control and complete
asset caching, recovers an exact lb/RPE draft after disconnect/reload, completes
and saves another set offline, checks history and model-free Coach, then reconnects
and verifies exactly one unchanged workout. Both existing mobile profiles run with
retries disabled. Chromium uses browser-context network emulation; the pinned
WebKit engine uses its documented dedicated loopback-server stop method, which is
not live or physical-phone network-emulation evidence.

This separate required step runs even if a regular journey fails (unless cancelled).
Its HTML report and traces remain under `offline-release` inside the same retained
artifact; they are separate from the grouped mobile-review counts. Each trace
includes source/tested commit, version/build, target origin, network method and
individual recovery stages. Running it last preserves both reports. This is a
review-tooling change: the approved runtime version, native build, manifest and
stored athlete data remain unchanged.

To run locally with the repository's Playwright browsers installed:

```sh
npx playwright test --config=playwright.mobile-review.config.js
```
