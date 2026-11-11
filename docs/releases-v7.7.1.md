# Loadnote v7.7.1 — Restore update status after worker takeover

Version 7.7.1 · unsigned native build 39701 · schema 34 unchanged.

When a briefly waiting service worker takes control without an explicit update request, Device & backup now removes the stale update offer and restores the preceding version-check result. Offline-file readiness is independent from live-version verification. A real waiting worker still requires Save and update, including the existing draft, persistence and other-tab guards.

The lifecycle keeps waiting-worker presentation separate from the live-check state and reconciles it on controller changes and ready-cache messages. A simulated first-install takeover reproduces the stale text on the previous source. This establishes the state-machine defect, but does not independently prove the timing of the earlier intermittent WebKit observation. Unchecked, verified, failed and offline results must survive takeover without a new live-current claim or a training write.

The mobile review adds three repetitions of each existing update scenario in both Chromium and WebKit with retries disabled before the complete beginner journeys. Existing narrow layout, uncached live-version failure, kg/lb unfinished entries, explicit activation and offline reload assertions remain required.

No history, RPE, unit, adaptation, training-status or storage schema changes; no migration is required. Existing useful offline Coach remains unchanged and requires no model download. The release tooling aligns package/lock, web/core/cache, Android/iOS, native beta metadata and all 319 asset hashes.

Rollback source baseline: merged main 1d2832b4a815f241c4733888df9ed13a76bea991 (v7.7.0/build39700). Keep main intact; restore prior behavior through a reviewed higher patch release if rollback is needed. This patch does not repair the separate live-hosting asset failure. Publication remains gated by the single-publisher check and owner hosting/republication decision. No deployment is authorized by this PR.

Validation evidence is recorded in weekly tracker #264 and the linked PR. Required gates include full Node suite, syntax/static, release manifest, mobile/native source checks, beta checks, dependency audit, full browser/WebKit, repeated no-retry mobile update journeys, native compilation, Android emulator and CodeQL. Physical-phone acceptance remains outstanding. Local browser installation was attempted but the available download returned invalid/truncated archives; CI must establish browser results. Do not describe pending gates as passing, merged or verified live.
