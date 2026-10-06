# Loadnote v3.7.1 — Mobile usability and release confidence

Based on merged v3.7.0. Progress empty states are shorter; the descriptive-evidence and non-causality explanation remains available under How to read these stories. Program management, adaptation and device-preference actions use consistent compact full-width rows on phones. Coach tabs wrap inside their three-column mobile layout at larger text sizes.

An oversized workout cockpit returns to document flow relative to the visible viewport, including viewport resize events. This is an automated layout safeguard, not proof of physical iPhone keyboard behavior.

Browser coverage adds short-screen, enlarged-root-text, scrolling hit-target checks and a scheduled three-set button-click benchmark. The benchmark counts browser button activations, not physical taps, speed or human performance. No telemetry is added. Entered work, completion and missing effort still require explicit athlete actions.

Full browser CI is divided into four independent shards, with fail-fast disabled and per-shard failure artifacts. The existing test job remains the aggregate release gate: it fails if any shard fails, is cancelled or skipped. Targeted demos and save-safety checks still run before that job's final gate. Faster feedback remains a measurement to verify, not a promised speedup.

Version 3.7.1/build 30701. No schema migration, prescription-engine change, automatic completion or persistence-policy change. Follow docs/mobile-acceptance.md on a physical phone before claiming device acceptance. Merged v3.7.0 remains the rollback baseline.
