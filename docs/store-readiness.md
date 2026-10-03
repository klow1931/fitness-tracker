# Store readiness roadmap

## v2.84 scope

This is a reliability foundation, not an App Store/Play Store release.
Schema v25, kg storage, training policy and athlete-approved prescription
changes remain unchanged. Today owns Home's primary workout action; another
date's recoverable draft takes priority over a new scheduled workout.
Companion polling preserves unchanged question controls and keyboard focus.

## Gate 1: reproducible web reliability

- Run locked install, syntax, domain, browser and mobile-bundle checks.
- Verify linked, unlinked and previous-date drafts after reload.
- Confirm resume preserves actual load/RPE without copying target RPE.
- Confirm review/save, revisions/undo, import preview and recovery restore.
- Exercise interrupted save, storage-full failure, upgrades and offline use.
- Require PR checks and review before release; do not confuse data health
  (`LoadnoteRelease.assess`) with native/store certification.

## Gate 2: native beta (requires platform setup)

- Confirm identifiers, signing ownership, developer accounts and toolchains.
- Generate Capacitor projects using `docs/mobile-release.md`.
- Validate native authentication redirects and secure session persistence.
- Test small/large iPhones and Android devices, VoiceOver/TalkBack, text scaling,
  keyboard obstruction, app termination, lock/background/foreground, offline
  recovery and upgrade persistence.
- Test rest timing and denied microphone permission/audio interruptions.
- Distribute signed TestFlight/Play closed-test builds, not just a web bundle.

## Gate 3: production operations and privacy

- Provision auth/cloud/AI services; choose a tested transactional/durable storage
  strategy, backup restore process, request quotas, spending limits and redacted
  observability. Keep provider secrets on the server.
- Publish support and privacy URLs; describe text, voice/audio and cloud flows,
  recipients, retention, consent withdrawal and account/data deletion.
- Obtain explicit consent before third-party AI data transmission.
- Test in-app account deletion and provide the required external request route.
- Complete current Apple privacy/Google Data Safety and health declarations;
  verify platform/API and testing requirements at submission time.

## Gate 4: focused launch

- Recruit strength/powerlifting beta athletes with diverse experience/devices.
- Measure unaided first-workout completion, repeated use and support failures.
- Independently review program explanations and progression guardrails.
- Set pricing/entitlements, listings, screenshots, review access and support.
- Launch only after no unresolved data-loss defects and all required gates pass.

Native signing, service provisioning, developer agreements, privacy/legal
approval and store submission are separate owner-controlled steps. They are
not performed or certified by v2.84.
