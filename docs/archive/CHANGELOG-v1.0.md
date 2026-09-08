# Loadnote v1.0 — Athlete Release

## Product loop
- Athlete profile and goals
- Active program and adaptive mesocycle state
- Today's/next-session command center on Dashboard
- Workout logging with RPE
- Deterministic training intelligence
- Performance and fatigue signals
- Adaptive progression decisions
- Coach context and structured recommendations

## Foundation
- Schema version 10 with v9 → v10 migration
- Local IndexedDB storage remains the source of truth for offline use
- Stable record IDs and JSON backup compatibility preserved
- Added release/data-quality assessment helper
- Added regression coverage for release readiness

## UX
- Dashboard now leads with the athlete's next training action
- Active program shows week/block context and next session prescription
- Training status and performance are surfaced before secondary analytics

## Validation
- Full Node test suite passes
- JavaScript syntax checks pass

## Scope note
v1.0 is the first coherent athlete product release of the current codebase. Production distribution still requires external account/deployment work (AI backend hosting, authentication/cloud sync, store signing/submission, privacy/legal documents, and payment infrastructure).
