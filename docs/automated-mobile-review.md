# Automated mobile review

Open **Actions → Loadnote mobile review → Summary** to compare the Android-style Chromium and iPhone-style WebKit results for the same Loadnote version. The workflow runs on pull requests and, once merged, weekly on Mondays at 12:23 UTC. Use **Run workflow** for an on-demand review.

The summary groups existing beginner journeys by review area and flags failures and tests that passed on retry. The **loadnote-mobile-review** artifact includes the HTML report, a Markdown copy of the mobile comparison, screenshots where captured, and available failure traces. Update and draft-protection checks appear separately in the run summary because they test service worker and application logic rather than an installed phone.

For a confirmed failure, record the version, browser profile, scenario, reproduction steps, and impact in the review backlog. Prioritize interrupted workout logging, draft loss, and inaccessible controls. Compare the same scenario after the fix.

The offline/update area also runs a real waiting-worker upgrade with unfinished kg and lb entries, an offline reload, and a fresh live-version check with a deliberately stale cached manifest. These use a dedicated local origin. Pages separately checks the actual published release and every app/offline asset after deployment; see [v7.7 release preparation](releases-v7.7.md).

Scheduled and manual reviews on main additionally verify the current live release and every manifest asset. PRs do not compare unpublished assets to production. A failure in this step is a deployment finding, separate from browser journey results. The publication workflow checks that Pages uses a single GitHub Actions publisher before deploying; see [publisher recovery](pages-publisher-recovery.md).

The verified-history/adaptation area selects the existing v64, v4, v41 and v42 journeys in both mobile profiles. It checks exact-identity confirmed performance, kg/lb display separation, exclusion of same-day/unconfirmed/ambiguous history, comparable RPE and unknown effort, prescription chronology, next-session evidence and unfinished-draft priority. The assertions preserve saved records and avoid silently changing future plans. This is evidence of those specific scenarios, not a claim that every adaptation or real athlete outcome has been validated.

A Node coverage gate runs Playwright discovery without launching browsers to ensure those scenarios remain selected in both profiles. It also exercises the grouped reporter with synthetic pass/retry/failure/skipped results, so missing or flaky evidence is not presented as a clean pass. Browser execution remains a separate required gate. The workflow also repeats the existing update journeys three times in both profiles with retries disabled before the complete review.

This review-tooling update retains v7.7.1/build39701/schema34 and the unchanged release manifest; it does not change runtime assets or training data. Rollback source baseline is merged main `2cdfd7b12bb2d79b816ca1e46166a16cfa2808bc`; reverting the selection/test change does not repair live hosting. Keep live/offline recovery and physical-device acceptance separate.

The review uses synthetic workouts and deterministic research fixtures. Offline Coach scenarios exercise local answers without downloading an LLM. Internet-enabled research paths use controlled responses. Physical keyboards, touch ergonomics, screen readers, installation, and real low-storage behavior remain separate device checks.

To run locally with the repository's Playwright browsers installed:

```sh
npx playwright test --config=playwright.mobile-review.config.js
```
