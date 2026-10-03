# Loadnote v2.84.0

## Store Readiness Foundation

- Today is the primary Home workout action; the athlete card becomes a summary.
- Hide empty-log onboarding while unfinished or today's scheduled work exists.
- Resume scheduled drafts from another date before starting a new session.
- Preserve unchanged Companion quick-question controls across refreshes.
- Avoid duplicate empty-workout actions in Train.
- Synchronize README, changelog, lockfile, footer, export and cache versions.
- Restore the documented build-assets command and correct Capacitor instructions.

Schema v25, units, RPE/estimated-capacity math and programming policies are
unchanged. No online services, store accounts or native releases are provisioned.
See `store-readiness.md` for beta, operational, privacy and submission gates.

## Acceptance checks

- Resume linked, manual and previous-date drafts after reload with load/RPE intact.
- Confirm Today's scheduled start remains available only when no unrelated draft exists.
- Keep a quick question focused across Companion polling; send one response per click.
- Verify questions still change when a workout/rest starts or stops.
- Run full domain, syntax, release, mobile-bundle and desktop/mobile browser suites.
- Complete real-device/offline/upgrade acceptance before native distribution.
