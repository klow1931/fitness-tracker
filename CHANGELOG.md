# v1.3.0 — Compare, review, and edit workouts

- Show previous-session values beside current entries, matching exercise name and tracking mode; exclude the edited workout and sessions after the selected date.
- Add an accessible review dialog before creating or updating a workout. Back preserves the draft; successful saves clear it only after persistence succeeds.
- Add History → Edit, preserve session identity and program metadata, restore unfinished edits, and reject edits whose original record was deleted or changed.
- Recalculate v1.3-managed workout PRs when workouts are corrected; preserve independent manual and older unclassified PR benchmarks. Older PRs cannot reliably be attributed to a session and are not silently reduced.
- Add pure session logic and regression coverage for editing, units, comparisons, provenance, review saves, and browser flows.
- Update version and service-worker cache to v1.3.0.

## v1.2.1 — Reliability and project cleanup

- Handle string/UUID and legacy numeric IDs safely in workout-history, template, and PR actions.
- Escape workout names, notes, template labels, and ID attributes at updated rendering boundaries.
- Store named draft fields; migrate v1.2 drafts for strength, timed holds, and cardio. Reject malformed draft structures without crashing restoration.
- Confirm before Last weights / + Jump overwrites entered sets; automatic loading never overwrites entered values. Previous RPE is not copied into Last weights, repeat, or template sessions. Tracking mode follows the loaded session.
- Extract persistence into a snapshotting, ordered writer. Resolve IndexedDB saves after transaction completion; report non-workout save failures visibly. Prefer marked fallback data on reload instead of stale IndexedDB data.
- Wait for successful import persistence before displaying success; restore the previous in-memory state if import fails.
- Extract workout-history rendering from the legacy app; retain existing training business rules.
- Consolidate current setup documentation and archive historical release notes without deleting them.
- Add Node regression tests and desktop/mobile Chromium browser tests, plus a read-only GitHub Actions test workflow.
- Update app/package version and service-worker cache to v1.2.1; include new modules in the offline asset list.

Automated browser execution and visual/iOS checks remain pending in the authoring environment. See `docs/testing.md` for exact coverage and remaining checks.
