# Loadnote v3.59.0 — Coach Clarity & First-Week Experience

Status: development release candidate based on merged v3.58 (`fa0264d`). Keep v3.58 as the rollback branch until all remote CI checks and athlete acceptance pass. Do not describe device acceptance, cloud backup or mobile-store approval as complete.

## What changed

1. **Readable Coach recaps.** Offline monthly recaps, dated competition-lift stall answers and the current-program/next-action response can show three short sections: What happened, What it means, Your next action. Original explanations, dates and limitations remain in an expandable disclosure in both full Coach and Companion. Generative/online responses are not relabeled as verified evidence.
2. **Sparse-data usefulness.** Supported trend reports show last-28-day eligible set/session counts and a dated strongest set. When early and recent periods have a higher load at the same rep count, that exact logged milestone can be described even if capacity comparisons lack RPE. This never proves increased strength, readiness or a cause. Comparable RPE-aware observations remain necessary for a capacity trend.
3. **Natural training days.** Saved-preference explanations show weekday names rather than zero-based indexes; internal Monday=0 storage remains unchanged.
4. **Long-program handoff.** Standalone reviewed strength phase requests remain 5–13 weeks; an explicit powerlifting meet-prep request may span 7–52 weeks. A longer standalone strength request asks whether a meet/mock meet is intended. On confirmation, the existing phase builder collects exact exercise identities, training maxes and reviewed exposures; the meet timeline defaults to the requested length with a reviewable Saturday suggestion. The athlete must confirm event type/date, preview quality gates, save and separately schedule. A six-week phase preview in this flow is a lift-setup aid, **not** a substituted shortened training cycle.
5. **No silent coaching-memory writes.** An exact instruction such as “Use Monday, Wednesday and Friday as my training days” offers a Profile review card showing current and proposed weekdays. Ambiguous/incomplete day sets are not auto-parsed. The card checks the originating profile revision before opening and again before Save. Only explicit athlete Save creates a new versioned profile; existing workouts/programs are preserved.

## Boundaries and architecture

- Reuses `LoadnoteOfflinePlanner`, `LoadnotePhaseBuilder`, `LoadnoteMeetCycle`, `LoadnoteProgrammingProfile`, `LoadnoteProgressStory` and current Coach interfaces. No duplicate prescription engine, new cloud service or migration.
- Original reviewed prescriptions, actual completed work and immutable history are not modified by conversation. Chat cannot schedule training or infer fresh training maxes.
- The optional device model remains experimental. AI-generated prose is not promoted to the deterministic three-step evidence card.
- Schema **32**, storage weight **kg**, native beta **local-only**, build **33403**. Web and native package version **3.59.0**.

## Release gates

- Run `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native`, `npm run check:beta` and the full Chromium and iPhone WebKit regression suites.
- Explicit regression coverage: long-cycle duration/date handoff; missing/max/RPE distinction; previous profile revision guard; mobile touch review; no chat writes; workout, program, schedule immutability; service worker version alignment.
- CI must pass after the branch is published. **Do not merge a red PR.** Separately perform physical-device force-close/upgrade/low-storage/export/restore and cross-device recovery checks from Phase 6; source checks cannot certify these.
- Use [the first-week Coach pilot](first-week-coach-pilot.md) and existing [Phase 6 athlete-beta acceptance](phase6-athlete-beta-acceptance.md) for evidence before distribution.
