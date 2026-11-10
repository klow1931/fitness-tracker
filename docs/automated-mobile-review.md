# Automated mobile review

Open **Actions → Loadnote mobile review → Summary** to compare the Android-style Chromium and iPhone-style WebKit results for the same Loadnote version. The workflow runs on pull requests and, once merged, weekly on Mondays at 12:23 UTC. Use **Run workflow** for an on-demand review.

The summary groups existing beginner journeys by review area and flags failures and tests that passed on retry. The **loadnote-mobile-review** artifact includes the HTML report, a Markdown copy of the mobile comparison, screenshots where captured, and available failure traces. Update and draft-protection checks appear separately in the run summary because they test service worker and application logic rather than an installed phone.

For a confirmed failure, record the version, browser profile, scenario, reproduction steps, and impact in the review backlog. Prioritize interrupted workout logging, draft loss, and inaccessible controls. Compare the same scenario after the fix.

The offline/update area also runs a real waiting-worker upgrade with unfinished kg and lb entries, an offline reload, and a fresh live-version check with a deliberately stale cached manifest. These use a dedicated local origin. Pages separately checks the actual published release and every app/offline asset after deployment; see [v7.7 release preparation](releases-v7.7.md).

The review uses synthetic workouts and deterministic research fixtures. Offline Coach scenarios exercise local answers without downloading an LLM. Internet-enabled research paths use controlled responses. Physical keyboards, touch ergonomics, screen readers, installation, and real low-storage behavior remain separate device checks.

To run locally with the repository's Playwright browsers installed:

```sh
npx playwright test --config=playwright.mobile-review.config.js
```
