# v1.3.1 — First code-consolidation pass

- Move workout forms, templates/repeats, history orchestration, units, rest timing, state loading/saving, and import/export into focused files.
- Share named draft capture and conversion between sessions/templates while preserving template-specific behavior.
- Share performance lookup with caller-specific ordering and filters.
- Replace inline handlers in the workout panel, generated workout controls, and review dialog with scoped, idempotent event delegation.
- Archive retired technique-review code without deleting its saved `formReviews` records.
- Add production-script-order, storage, template and delegated-control regressions. Interface, schema version 10, and storage keys stay unchanged.

## v1.3.0 — Compare, review, and edit workouts

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
# v1.4.0 — Nutrition reliability

- Save food additions, removals, portion edits and cleared days immediately with visible save status.
- Preserve historical totals-only days; add recent-food reuse and optional user-set calorie/protein targets.
- Isolate nutrition calculations and UI from app.js. Use one barcode nutrient basis, explicit gram conversions and unknown values for missing nutrients.
- Validate entries and escape food text/IDs. Add nutrition model and desktop/mobile browser regressions.
- Existing stored zero values cannot be distinguished from historically missing nutrients. Existing barcode foods should be checked against their labels or looked up again after removing the old library copy.
# v1.4.1 — Nutrition summaries and editing

- Complete-day summaries with nutrient-specific coverage across dashboard, weekly report and coach.
- Direct g/ml portions with explicit serving basis; mobile food and recent-entry dialogs replace prompts.
- Correct names/nutrients in entries or library; review barcode refresh against package labels before replacing library values.
- Preserve historical meals and unconfirmed legacy days. Scanner implementation unchanged.
# v1.5.0 — Navigation and daily flow

- Remember subsection, scroll position and food mode during tab switches.
- Render only selected views and refresh on saved-data changes.
- Keep food totals visible while adding foods; emphasize Add food and group day maintenance actions.
- Mobile action placement, 44px buttons, input sizing, destination focus and reduced-motion support.
- Add navigation regression tests and a render-count benchmark. No saved-data migration.
# v1.5.1 — Measurements layout

- New overview tiles, grouped entry fields, focused trend panel and expandable history cards that include notes and neck measurements.
- Responsive layout, dark styling, clearer labels and edit state. Existing dates and stored centimeter values preserved.
- Convert in-progress measurement values when switching cm/in instead of relabeling them.
# v1.5.2 — More pages

- Calendar, PRs, Photos and Tools share the Measurements visual language with clear headers and responsive cards.
- Keyboard-accessible calendar days, stacked record cards, separate photo entry/comparison/journal, grouped calculators and backups.
- Advanced RPE, credits and demo data are expandable. Photo notes and identifiers are escaped in rendered markup.
- Existing calculators, records, backups and photo storage retained.
