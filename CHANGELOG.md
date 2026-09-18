# v2.0.0 — Decision engine and Training Review UX

- Added the first deterministic, read-only Training Decision Engine for confirmed competition squat, bench press and deadlift evidence, returning Increase, Hold, Reduce or Insufficient evidence with explicit reasons.
- Preserved demonstrated capacity versus prescription, conservative return/re-entry context, explicit analysis dates and point-in-time replay; submaximal singles remain observed load/RPE rather than inferred capacity.
- Made Training Review collapsed by default and added display-only exercise filtering so athletes can focus on selected lifts without changing saved history or calculations.
- Rolled the service-worker cache to v2.0.0 so installed/offline clients can detect the release instead of continuing to serve v1.17.0 cached assets.
- No stored-schema migration, automatic workout/program changes or numeric confidence score.

# v1.17.0 — History cleanup & coverage

- Added review-only middle-set load flags, name-based alias suggestions with side-by-side history, and block coverage summaries in Workout History.
- Routed confirmed changes through existing workout/block editors and identity merge controls, preserving revision/undo and recovery paths.
- Added current-corrected Training Review edit links and separate observed single load/RPE tables; historical snapshots stay read-only.
- Added synthetic model/browser regressions and offline assets. No persisted schema changes, personal-data corrections or new estimates.

# v1.16.0 — Evidence clarity and block reviews

- Added shared capacity-evidence classification across Training Review, blocks and Decision Readiness. Submaximal singles stay logged, but no longer supply capacity estimates.
- Distinguished low-effort sets from absent/invalid RPE and high-repetition exclusions; retained hard-set counts and RPE coverage independently of estimate eligibility.
- Added block-specific Training Review with analysis-date clipping and explicit errors for unavailable historical context.
- Added a capacity-evidence-day readiness guard, synthetic unit/browser regressions and clarified legacy chart single labels.
- No schema migration, personal-data edits, PR recalculation or new estimator formula. Existing stored data and legacy estimates remain unchanged; stricter review evidence can change displayed trends.

# v1.15.0 — Training Review

- Added compact date/range/mode controls, weekly schedule outcomes and expandable per-lift evidence alongside Strength Progress.
- Reused block sparse-data guards and RPE-aware capacity calculations; kept prescription and actual-load trends separate from estimated performance.
- Withheld aggregate trends across changing training contexts and disclosed missing RPE, missing plans and retrospective knowledge.
- Reused retained workout-history replay; added chronology, nonmutation, unit, scheduling and offline browser regressions.
- No schema change, new recommendations or automatic program adjustments.

# v1.14.0 — Plan Your Week

- Schedule captured template, program-day or logger plans independently of completed workouts.
- Start linked drafts, preserve prescriptions and derive completion only from successful workout saves.
- Revisioned reschedules, skipped/cancelled reasons, explicit unconfirmed sessions and retrospective labels.
- Resolved-session adherence shows counts and exclusions; backups retain schedules. Schema 15 adds an empty collection for older users.

# v1.13.1 — Prescription comparison corrections

- Group repeated exercise rows by identity and tracking mode; compare flattened positions without reusing completed sets.
- Convert cardio distances to meters before comparing planned and completed targets.
- Preserve target heart rate through repeated normalization and backup roundtrips.
- Separate prescription coverage from adherence; adherence remains unknown without scheduling evidence.

# v1.13.0 — Training Prescription & Session Intent

- Add optional session roles and goals to the workout logger, with deviation reasons for fatigue, pain, time, equipment, autoregulation or programming changes.
- Capture immutable planned-work snapshots separately from completed sets. Manual plans preserve entered RPE as target RPE and clear the live RPE field for actual effort.
- Automatically capture planned work when loading templates, repeating workouts or starting generated program days, while preserving source provenance.
- Compare planned and completed sets in review and History. Report prescription coverage, completion and unexplained modifications in block analysis and per-lift Decision Readiness.
- Keep missing prescriptions unknown rather than treating older or incomplete history as failed adherence. Retain workout revision and point-in-time replay safeguards.
- Migrate schema 13 to 14 without changing existing workouts. Keep automated training decisions disabled and align release, cache, documentation and test metadata at v1.13.0.

# v1.12.0 — Athlete Model & Decision Readiness

- Add revisioned, athlete-confirmed exercise roles for competition lifts, close variations, supplemental work, assistance, isolation/rehabilitation and conditioning. Suggestions only populate the form and never save automatically.
- Build an explicit-date evidence snapshot for squat, bench and deadlift with active block context, matching sessions, RPE coverage and point-in-time knowledge cutoffs.
- Keep logged working load, RPE-aware estimated capacity, block training max, known 1RM and legacy profile benchmark separate with source and date labels.
- Report per-lift Ready, Limited or Not ready states with concrete missing-evidence reasons. No aggregate readiness score and no automated training decision.
- Add saved-at timestamps and creation revisions to newly logged workouts. Reverse later edit/delete/undo revisions during strict replay while flagging legacy workouts whose original save time cannot be reconstructed.
- Migrate schema 12 to 13 with an empty exercise-role collection. Preserve workout, set, date, load, block and benchmark values.
- Add desktop/mobile browser coverage for confirmed mappings, conservative-return interpretation and as-recorded withholding. Align export validation, service-worker cache, footer and release metadata at v1.12.0.

# v1.11.0 — Training Data Integrity

- Assign stable exercise identities while preserving the original labels in workouts, templates, PRs and block benchmarks. Automatically link compact spelling variants and provide an explicit alias merge tool.
- Retain bounded workout edit/deletion revisions, expose safe History-level undo and add an explicit Duplicate action that always creates a new draft.
- Preview workout, block and template changes before JSON replacement imports; create restorable local snapshots before imports and identity merges.
- Mark block workout coverage as unknown, incomplete or complete. Withhold full-block frequency for incomplete history and report observed logging frequency separately.
- Add conservative-return presets and warnings for contradictory block strategy/intent combinations. Label weighted tonnage and its exclusions honestly.
- Migrate schema 11 to 12 without changing historical set/date/load values. Align export, footer, service-worker cache and release metadata at v1.11.0.
- No v2 automated training decisions.

# v1.10.0 — Training Block Context

- Add dated training blocks with structured type, goal, loading strategy and progression intent.
- Keep programming training maxes and known 1RMs separate from RPE-aware performance estimates; store benchmark loads in kg with known-on dates.
- Associate historical workouts by date without rewriting them; reject overlaps, retain revision/deletion history and expose chronological as-recorded and explicit retrospective APIs.
- Add compact workout-page editing, sparse block analytics and complete JSON backup validation.
- Migrate schema 10 to 11 with an empty block collection for existing users. Retain v1.9 offline assets, drafts and update controls.
- No v2 recommendations or predictions.

# v1.9.0 — Gym-ready reliability

- Bundle utility styles and charts with pinned dependencies and a lockfile.
- Cache complete release assets for offline workouts, history and timers after initial setup.
- Wait for Save and update; persist the draft and app data before activation and block updates with other open tabs.
- Show device save status, connection guidance and a visible backup shortcut.
- Add real-asset and offline regressions. Physical iPhone acceptance remains required.

# v1.8.1 — Analytics, interface and release housekeeping

- Delay fatigue scoring until sufficient history exists; use the minimum-session plateau guard and avoid one-session percentage trends.
- Include optional RPE in progress estimates to match the training dashboard.
- Keep review/rest controls in normal page flow and remove the duplicate floating Gym-mode bar.
- Give coach suggested questions explicit light/night colors, hover contrast and touch targets.
- Align package, app footer, release helper and cache versions; refresh current documentation and add release-consistency assertions.
- Preserve workout data and schema version 10.

# v1.8.0 — Progress and history

- Paginated, naturally sized history cards with expandable exercises, date filters and stable newest-first ordering.
- Exercise details combine recent sets, best load/estimated 1RM and 4-week, 12-week or all-time trends; tracking modes stay separate.
- Compare any two saved workouts by exercise name and tracking mode, with unmatched movements explicitly labeled.
- Workout deletion durably commits recalculated derived PRs and preserves manual benchmarks. Failed saves leave history and records unchanged.
- Existing workout edits retain their PR reconciliation. No historical schema migration.

# v1.7.0 — Training flow

- Optional Focus mode highlights the next unfinished exercise and collapses completed exercises, with controls to reopen them.
- Entered-set progress, cardio completion, and a Finish workout action that retains the existing review step.
- Deadline-based rest ring with pause/resume, +30 seconds, and refresh recovery.
- Post-save recap with session totals, personal bests, and prior matching exercise sets.
- Move exercises up/down and explicitly swap names while retaining entered sets, notes and checkmarks. Draft order and cardio completion survive refresh.

# v1.6.0 — A stronger rhythm

- Home leads with the next workout and a Monday–Sunday activity strip with session and recovery states.
- Shared indigo/teal styling, larger statistics, consistent mobile navigation icons and richer page headers.
- Completed sets retain readable values; saved workouts and new PRs get distinct feedback. Reduced-motion preferences are honored.
- Home shortcuts preserve drafts. Weekly activity excludes future sessions and uses local calendar dates.
- No data migration. Existing training, nutrition and backup flows retained.

# v1.5.2 — More pages

- Calendar, PRs, Photos and Tools share the Measurements visual language with clear headers and responsive cards.
- Keyboard-accessible calendar days, stacked record cards, separate photo entry/comparison/journal, grouped calculators and backups.
- Advanced RPE, credits and demo data are expandable. Photo notes and identifiers are escaped in rendered markup.
- Existing calculators, records, backups and photo storage retained.

# v1.5.1 — Measurements layout

- New overview tiles, grouped entry fields, focused trend panel and expandable history cards that include notes and neck measurements.
- Responsive layout, dark styling, clearer labels and edit state. Existing dates and stored centimeter values preserved.
- Convert in-progress measurement values when switching cm/in instead of relabeling them.

# v1.5.0 — Navigation and daily flow

- Remember subsection, scroll position and food mode during tab switches.
- Render only selected views and refresh on saved-data changes.
- Keep food totals visible while adding foods; emphasize Add food and group day maintenance actions.
- Mobile action placement, 44px buttons, input sizing, destination focus and reduced-motion support.
- Add navigation regression tests and a render-count benchmark. No saved-data migration.

# v1.4.1 — Nutrition summaries and editing

- Complete-day summaries with nutrient-specific coverage across dashboard, weekly report and coach.
- Direct g/ml portions with explicit serving basis; mobile food and recent-entry dialogs replace prompts.
- Correct names/nutrients in entries or library; review barcode refresh against package labels before replacing library values.
- Preserve historical meals and unconfirmed legacy days. Scanner implementation unchanged.

# v1.4.0 — Nutrition reliability

- Save food additions, removals, portion edits and cleared days immediately with visible save status.
- Preserve historical totals-only days; add recent-food reuse and optional user-set calorie/protein targets.
- Isolate nutrition calculations and UI from app.js. Use one barcode nutrient basis, explicit gram conversions and unknown values for missing nutrients.
- Validate entries and escape food text/IDs. Add nutrition model and desktop/mobile browser regressions.
- Existing stored zero values cannot be distinguished from historically missing nutrients. Existing barcode foods should be checked against their labels or looked up again after removing the old library copy.

# v1.3.1 — First code-consolidation pass

- Move workout forms, templates/repeats, history orchestration, units, rest timing, state loading/saving, and import/export into focused files.
- Share named draft capture and conversion between sessions/templates while preserving template-specific behavior.
- Share performance lookup with caller-specific ordering and filters.
- Replace inline handlers in the workout panel, generated workout controls, and review dialog with scoped, idempotent event delegation.
- Archive retired technique-review code without deleting its saved `formReviews` records.
- Add production-script-order, storage, template and delegated-control regressions. Interface, schema version 10, and storage keys stay unchanged.

# v1.3.0 — Compare, review, and edit workouts

- Show previous-session values beside current entries, matching exercise name and tracking mode; exclude the edited workout and sessions after the selected date.
- Add an accessible review dialog before creating or updating a workout. Back preserves the draft; successful saves clear it only after persistence succeeds.
- Add History → Edit, preserve session identity and program metadata, restore unfinished edits, and reject edits whose original record was deleted or changed.
- Recalculate v1.3-managed workout PRs when workouts are corrected; preserve independent manual and older unclassified PR benchmarks. Older PRs cannot reliably be attributed to a session and are not silently reduced.
- Add pure session logic and regression coverage for editing, units, comparisons, provenance, review saves, and browser flows.
- Update version and service-worker cache to v1.3.0.

# v1.2.1 — Reliability and project cleanup

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
