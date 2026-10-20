# Loadnote v3.73.0 — v3.71–v3.73 combined training-feedback and Android pilot update

One PR, one deployable **3.73.0** version: the three feature milestone numbers are not separate shipped builds. Native build **33480**; schema **34**. Existing workout, PR, program and Calendar identities are preserved.

## v3.71 — Adaptive training intelligence, without silent prescriptions

- **Custom Program Studio → Plan and training check → Weekly training review** shows a completed week, exact linked sessions, explicit skips, unresolved dates, matched strength sets and known logged RPE.
- The review flags repeated above-cap effort, explicit skips, incomplete comparisons and athlete-reported recovery concerns as **reasons to review**, not prescriptions, diagnoses or proof of excess training.
- The athlete can open Decisions or copy the program to edit. Any change to future Calendar dates still follows the separately reviewed v3.65 future-only replacement flow; this review cannot edit training by itself.
- An explicit uploaded/custom-program weekly-review question to the offline Coach gets the same read-only, Calendar-linked evidence, with unknowns and limitations identified. Personal notes are **not** surfaced in that answer.

## v3.72 — Week-by-week check-in and feedback history

- Athletes can report sleep, fatigue, soreness, whether sessions followed the plan, and optional reflection notes. Each field can remain **Not reported**; data is never presented as an objective recovery measure.
- Check-ins belong to one saved program and completed week. A corrected report **appends** a new entry so earlier reports remain auditable. Program and Calendar prescriptions do not change.
- Schema-34 migration adds `customProgramWeeklyReviews`; it participates in normal local persistence, backup count/fingerprint checks, import review, and optional account sync, with old schema-33 packages still readable. Reflection notes are included in backups and account sync where enabled.
- New unit and browser tests cover incomplete evidence, repeated reports, attribution limits, reload persistence, and non-mutating behavior.

## v3.73 — Android beta readiness

- The disposable offline Android emulator journey now checks a synthetic past custom-program week, an explicitly saved review, Calendar non-mutation, export/restore and survival across WebView activity recreation.
- The source beta gate checks new review assets and data portability, and the [Android pilot checklist](android-v3.73-pilot.md) defines human/device acceptance and release-blocking failures.
- The unsigned development beta remains **local-only, not store-ready**. A passed emulator test is not a substitute for physical device testing, signing, Play Console policy declarations or athlete acceptance.

## Acceptance

1. Export and verify a v3.70 backup before updating a device with training history.
2. On an iPhone Home Screen installation, confirm version 3.73.0, cold-reopen and use the app offline; do not delete the old installation until backup/restore checks are complete.
3. With a reviewed, scheduled two-week custom program, inspect a completed week and verify an unlogged Calendar date is **unconfirmed**, not automatically skipped.
4. Save a check-in, reload offline and confirm it persists; correct a field and confirm history count increments without changing scheduled sessions or logs.
5. Copy the program to propose an edit, inspect changed exercises/targets, then separately approve any future-only Calendar replacement. Verify today and the past are untouched.
6. On the disposable Android emulator, run the documented beta journey; separately complete the physical-device checklist with tester consent and retain the first bug report/backup safely.

**Boundaries:** No self-training model, external upload of imported program files, medical treatment guidance, automatic load increase, assumed skipped workout, guaranteed athlete progress or unverified Play Store readiness.
