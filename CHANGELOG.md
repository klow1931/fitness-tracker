# v2.28.0 — Reviewed meet-peak training proposals

- Extend the existing meet timeline with a bounded, read-only competition-specific weekly session preview for squat, bench and deadlift. Use each confirmed competition exercise, athlete-selected training max, reviewed primary-exposure day and load increment; exclude variation and accessory loads.
- Include a lower-volume final taper-week example, explicit RPE caps, actual dated competition-lift history and descriptive estimated-capacity context. Flag incomplete evidence, above-RPE-8 logged sets, lower observed estimates and Calendar conflicts for individual review.
- Preserve the existing phase program and meet timeline, the 85% training-max ceiling, immutable training and athlete approval safeguards. No automatic scheduling, max attempts, opener choice, meet-week doses, or schema migration.
- Add model and browser tests, release metadata and offline cache.

# v2.27.0 — In-workout set guidance

- Show each scheduled strength set’s approved load, reps, and RPE cap directly beside the numeric logging controls. After a set is explicitly checked, display the next unchanged approved target and explain logged RPE versus the cap or missing/mismatched data.
- Enable checked-set controls on scheduled workout entry even when optional checklist mode is off, and carry completion controls into added sets and tracking-mode switches. Preserve fast numeric entry, manual freedom to deviate, draft restoration, existing workout-saving behavior and original Calendar revisions.
- Keep all weight comparisons in internal kg and convert only displayed targets to the athlete’s selected unit. No automatic load, volume or session changes, and no schema migration.
- Add deterministic set-feedback tests, mobile/browser regressions and offline assets.

# v2.26.0 — Training targets at workout start

- Add read-only, identity-aware previous-performance and approved-target context for scheduled workouts, available on the weekly/Calendar plan and an expandable “Why this workout?” section in the active workout logger. Keep the primary logging surface uncluttered for unscheduled sessions.
- Explain approved phase-review load/set changes from the existing immutable Calendar revisions and per-lift reasons. Show prescribed load, reps and RPE caps in the display unit, and preserve previous logged RPE distinctly from planned effort.
- Maintain draft, workout history, original prescriptions and athlete approval safeguards; context never adjusts weights, sets or RPE automatically. Add Node/browser regression tests and offline caching. No data migration.

# v2.25.0 — Explainable phase-programming feedback loop

- Connect each accepted phase decision to its linked next-phase observations and to a subsequent phase review, independently by competition lift. Show the prior athlete-approved choice and reason, exactly comparable follow-up exposures, RPE-cap observations and descriptive competition-lift estimated-capacity change.
- Differentiate pending phases, insufficient/changed evidence, RPE-cap review and estimated-capacity review; do not attribute observed changes to one programming action or infer physiological fatigue.
- Preserve the existing phase-review engine, decision eligibility, manual approval and immutable data. Feedback cannot write Calendar sessions, automatically progress loads or replace the current phase-review findings.
- Add model and browser regressions, release metadata and offline asset cache. No user-data migration.

# v2.24.0 — Accepted phase decision outcomes

- Show per-lift follow-up after accepted phase reviews, relating each approved next-phase prescription to linked completed sets and reps, logged RPE versus approved caps, and descriptive early-versus-follow-up estimated capacity where sufficient comparable competition-lift evidence exists.
- Preserve exact as-recorded knowledge cutoffs, exercise identities and Calendar revision links. Missing, altered, ambiguous, unconfirmed or RPE-incomplete work is surfaced rather than counted as evidence that an adjustment helped.
- Keep evaluation read-only; never imply causation, rewrite an approved program, or trigger automatic programming changes. No stored data migration.
- Add Node and browser regression coverage, synchronize release metadata and offline assets.

# v2.23.0 — Competition-lift performance context

- Compare early and late recent dated competition-lift estimated-capacity evidence independently for squat, bench and deadlift using existing load/reps/RPE eligibility rules, with four distinct dates spanning 14 days and median-of-two endpoints.
- Show higher/lower/similar/insufficient evidence context next to proposed workload choices; a lower estimate triggers explicit performance review but never an automatic training reduction or inferred fatigue diagnosis. Variations cannot establish competition-lift strength trends.
- Keep exercise-identity matching, as-recorded workout revision cutoffs, internal kg and display units separate. Preserve stored plans, calendars and completed workouts; add unit and browser regression coverage.
- Synchronize app, normalized export, package, footer, changelog and offline release metadata.

# v2.22.0 — Athlete-reviewed per-lift workload choices

- Interpret v2.21 per-lift sets and RPE coverage independently for squat, bench and deadlift. Show why a reduction is available or why more evidence is needed; no inferred optimal dose or unsupported automatic increase.
- Optionally reduce one set per exposure for an eligible lift in a NEW phase proposal only after explicit athlete choice. Regenerate and recheck all phases; keep unchanged as the default, preserve review notes, original programs, scheduled sessions and training history.
- Require four observed weeks, valid RPE coverage and a >25% proposed-versus-logged weekly set mismatch before offering this conservative review option. Missing logs do not imply low tolerance.
- Add model and browser regression tests and synchronize version/offline assets.

# v2.21.0 — Lift-specific workload evidence

- Compare each reviewed phase program's original first-week sets and exercise exposure frequency against four observed seven-day windows, separately counting competition lift and explicitly selected variation sets by exercise identity.
- Show valid-RPE coverage, kg-derived tonnage in the chosen display unit, sparse/missing-week cautions, and first-week workload/frequency mismatches as review-only evidence. No inferred optimal volume, fatigue diagnosis or auto-adjustment.
- Keep reviewed programs and workout history unchanged, add model and browser regression tests, and synchronize version and offline cache. Changes to lift-specific prescriptions remain subject to existing athlete review and approvals.

# v2.20.0 — Reviewable meet preparation timeline

- Make the v2.19 review-only meet timeline available inside saved, reviewed phase programs. Display the athlete's competition exercise identities, proposed specificity/peak/taper weeks, event week, and explicit gap/overlap cautions.
- Keep meet preparation a non-prescriptive preview: no automatically generated heavy singles, attempt selections, set loads, scheduling, or edits to workout history.
- Add browser regression coverage for valid and conflicting dates, and synchronize offline cache and release metadata. Per-lift dose optimization and outcome validation remain future work.

# v2.18.0 — Explainable phase transitions

- Preview last-phase final-week prescriptions against the first week of the scheduled next phase and the exact impact of selected, approved per-lift adjustments before acceptance.
- Surface specific Calendar, set, tonnage and frequency transition cautions without claiming a fatigue diagnosis or proven risk threshold.
- Keep strength → deload untouched, mark program completion after deload and preserve original programs, completed history, drafts and approval audit. No new stored schema or automatic week/phase extensions.
- Add pure model and desktop/mobile UI tests, synchronize release and offline assets. CI and physical iPhone status: see PR.

# v2.17.0 — Per-lift workload response

- Show week-by-week prescribed, logged and strictly matched sets for each lift alongside planned/logged exposure frequency, missing/changed sessions and explicit time constraints.
- Offer one additional final working set per next-phase lift exposure **only when** a rounded load increase is unavailable and three stable, complete training weeks with at least two weekly exposures, adequate effort/capacity evidence, usual reported recovery and time/set limits permit it. Never modify training days automatically.
- Preserve independent lift approvals, original prescriptions, drafts, chronological evidence and existing phase-effort-v1/v2 accepted reviews with a versioned phase-effort-v3 policy.
- No new stored schema (22), no automatic adaptation, and no claims of optimal volume or individual response causality.
- CI validation and manual iPhone status: see pull request.

# v2.16.0 — Individual lift progression and focused Decisions UX

- Phase review optionally proposes a 2.5% next-phase load increase only after complete matched work stays at least 1 RPE below caps of 7+, and at cap or below when the target is RPE 6 across repeated sessions, dated competition-only capacity evidence spans 14+ days, recovery is reported usual, and exercise-specific training-max ceilings and kg increments permit every target.
- Load increases, reductions and holds remain independent by lift and require explicit approval. Existing program prescriptions, original Calendar revisions, workout history and drafts remain protected.
- Decisions now starts with a compact current-plan, next-session and next-review action card; advanced programming tools follow beneath the primary review.
- Phase-review policy v2 validates the new transformation while preserving imported v1 review history. Schema 22 unchanged, no automatic adaptation or inferred optimum.
- Node, browser, offline and iPhone verification status: see pull request.

# v2.15.0 — Evidence-based phase reviews

- Per-lift completed-phase findings, recovery context and sparse-data guards.
- Explicit preview/approval of bounded next-strength-phase load or working-set reductions; planned deloads and completed history preserved.
- Chronological evidence replay, stale-review and draft protection, immutable originals and Calendar revision audit.
- Schema 22 phase review backup/import support and desktop/mobile offline regression coverage.
- No automatic increases, phase extensions, meet peaking or validated individualized coaching claims.

# v2.14.0 — Reviewed phase-based program builder

- Add accumulation → strength → deload sequences with editable durations, independent lift exposures/progression, straight sets and top-set/back-off formats.
- Require explicit variation choices, separate training maxes and equipment confirmation; preserve profile restrictions and stable exercise mappings.
- Add time, progression, workload-transition, sparse-history and Calendar checks with expandable weekly previews and separate approval/scheduling.
- Preserve older four-week programs and reviews; phase sequences use their own schema-21 records, backups and Calendar IDs. No meet peaks or automatic phase adjustments.
- See [generation rules and limitations](docs/phase-builder.md).

# v2.13.0 — Constraint-aware programming profile

- Add revisioned goals, availability, equipment, exercise preferences/restrictions and reported priorities under Decisions → Programs.
- Enforce supported structured constraints during proposal generation and scheduling; unsupported meet/hypertrophy plans are withheld rather than mislabeled.
- Preserve profile snapshots in reviewed programs; changed context requires a fresh review before scheduling, without rewriting existing training.
- Add schema-20 migration, JSON backup/import validation and offline assets. See [constraints and limits](docs/programming-profile.md).

# v2.12.0 — Review adjustment outcomes

- Add a compact read-only timeline connecting original programs, approved plans, recorded training and per-lift follow-up observations.
- Separate completion of prescribed work from RPE-comparable sessions; label changed, skipped, substituted, uncertain and pending work explicitly.
- Bound follow-up to the next program week with historical knowledge cutoffs, workout revision replay and sparse-data guards.
- Show recorded recovery check-ins without causal claims, automatic learning or plan changes. Schema remains 19.
- Synchronize release metadata and offline assets. See [definitions and limits](docs/program-outcomes.md).

# v2.11.0 — Program review and adjustment proposals

- Review completed builder-program weeks with separate squat, bench and deadlift findings, recovery context and original/planned/logged evidence.
- Preview optional next-week load reductions under a documented repeated-effort rule; require explicit approval and a fresh evidence check.
- Preserve workouts and original programs, append schedule revisions, protect completed sessions and open drafts, and prevent duplicate weekly approvals.
- Add schema-19 review history to JSON backups/imports, mobile UI and offline cache.
- No automatic increases or claims of individualized training-dose validation. See [policy and limits](docs/program-review.md).

# v2.10.0 — Reviewed powerlifting program builder

- Add transparent four-week return/base and strength proposals with confirmed lift identities, explicit training maxes, load rounding, effort caps and a planned deload.
- Apply goal availability, time-budget, equipment, event-date and calendar-conflict checks; show limitations before explicit review/save.
- Keep saved proposals immutable; schedule separately into the existing Calendar and goal workflow without activating legacy programs or replacing drafts.
- Add schema 18 reviewed-program validation, backup support and regression tests. Coach review is explicitly user-reported, never automatically claimed.

# v2.9.0 — Athlete goals and weekly planning

- Add revisioned athlete goals with sport, optional event/date and weight class, available training days, session time, equipment, experience and separate aspirational lift targets stored in kg.
- Link goals to existing blocks and scheduled sessions without rewriting workouts. Edit, complete or archive goals explicitly.
- Extend the home weekly planner with goal-scoped schedule counts, recorded RPE, planned-work coverage and guarded performance trends.
- Migrate to schema 17 without changing legacy goals or workout history; validate athlete goals on load/import and preserve them in backups/recovery snapshots.
- Keep this release descriptive: no automatic programming changes, inferred achievement or new non-powerlifting decision rules.

# v2.8.1 — Competition lift names

- Recognize competition, comp and meet prefixes plus sumo/conventional deadlift names in exercise-role suggestions.
- Explain custom-name mapping and retain athlete confirmation; no automatic history renaming or identity merging.
- Keep variations separate and retain chronological mapping history for backtesting.
- Add custom-name mapping, variation exclusion and desktop/mobile regression tests.

# v2.8.0 — Plan timing and session provenance

- Add explicit today-only session starts; opening a logger, restoring a draft or editing history never manufactures a start.
- Keep original prescriptions intact and append timestamped plan captures/removals. Later captures preserve entered actual RPE and completion checks.
- Carry optional validated timing through existing drafts, workout saves, revisions and backups without a schema migration.
- Classify original/revised plans as before training, after start, retrospective or unknown; date changes invalidate start-based timing for analysis.
- Permit same-day original plans in weekly follow-up comparisons only when they precede a recorded start; no live policy changes.

# v2.7.0 — Decision use and weekly review

- Add actionable evidence checklists inside withheld lift cards, linked to existing mappings, blocks, history and logger; historical review stays read-only.
- Separate intended direction, prospectively captured plan-load direction and completed set-load direction; withhold comparisons for missing timing or different set/rep structures.
- Add collapsed weekly responses and uniquely attributed follow-ups with explicit counts and uncertainty, without confusing load progression with strength gain.
- Preserve report-date cutoffs, retained workout revisions, sparse data, kg storage and existing feedback attribution. No schema or live decision-policy changes.
- Align the legacy core export release label with the current release, alongside package/footer/cache metadata.

# v2.6.3 — Context-aware feedback analysis (Part 2)

- Preserve structured block context in new feedback snapshots; older feedback remains context-unavailable, never retroactively filled.
- Add lift/identity/phase/strategy/intent cohorts, per-event exclusions and three-follow-up guards on response means.
- Require baseline and outcome to remain in the same known block context; retain unique attribution and late-response exclusions.
- Add a manual, read-only historical comparison of current and more cautious progression thresholds on identical dates. No learned thresholds or live rule changes.
- Keep both tools collapsed inside Decision performance; retain kg storage, existing backups and schema 16.

# v2.6.2 — Compact Progress & Records

- Reduce Progress overview to two compact summary cards with body-progress quick actions.
- Collapse Add PR and search the record book without changing saved records.
- Distinguish an actual single from a calculated estimated 1RM in compact rows.
- Place Delete behind a per-record actions menu and retain confirmation.
- Add mobile browser regression coverage; bump app version and offline cache.

# v2.6.1 — Focused training experience

- Make Home action-first: start/continue workout, view plan, compact training summary.
- Collapse training status/session preview and weekly plan without removing their functionality.
- Move device connection/export controls and backup reminder actions behind compact disclosures.
- Show squat/bench/deadlift decisions before analysis tools; group history, mappings, readiness and feedback in Decision settings & evidence.
- Surface missing evidence and next step per withheld lift; preserve strict decision rules and safety guidance.
- Add browser coverage for the default mobile-first organization and existing expanded flows.
- No workout, block or feedback schema changes.

# v2.6.0 — Block-aware decision intelligence (Part 1)

- Interpret explicitly saved phase and progression intent; show provenance beside compact lift decisions.
- Add plan-preserving guards for testing, deload and peaking without silently changing workout programming.
- Preserve return ramps and accumulation intent when competition-lift capacity improves.
- Withhold direction when recorded block type and intent conflict about the intended phase.
- Clearly distinguish missing training maxes/known 1RMs and unknown block history coverage from observed RPE capacity.
- Keep historical replay, mapped exercise IDs, RPE evidence, athlete control and local-first storage intact.
- Add phase-specific unit and browser tests and cache new module offline. No feedback-derived personalization or schema migration.

# v2.5.5 — Installed-app update visibility

- Ensure app version is consistently displayed in footer, release metadata and offline cache.
- Check for a waiting app update on startup, when returning to the tab and when connectivity returns (throttled to once per minute).
- Keep update application opt-in after draft/data persistence, without disrupting an active workout.
- Add automated coverage for update detection on tab resume.

# v2.5.4 — Quiet first view and progressive navigation

- Keep five primary destinations: Home, Train, Progress, Decisions and More.
- Group secondary desktop destinations and collapse mobile More options by task.
- Show Home's training command and weekly rhythm before optional metrics and reports.
- Collapse lift details, athlete-response actions, historical controls, programming tools and coaching safety detail until requested.
- Keep workout, coach, nutrition and decision data unchanged.
- Expand navigation and Decision Center browser coverage, including mobile More.

# v2.5.3 — Feedback analysis completion (v2.5.1–v2.5.3)

- v2.5.1: distinguish recorded recommendation overrides from unique observed follow-ups; show sample counts and follow-up outcome breakdowns.
- v2.5.2: link decision evidence to the exact workout ID, open and highlight its Train history card.
- v2.5.3: distinguish missing baseline, awaiting outcome, expired observation window, overlapping decisions and late-edited feedback.
- Show overall and comparable outcome coverage with explicit denominators.
- Exclude feedback edited on/after the workout from prospective outcome attribution and continue to exclude future-dated records.
- Expand synthetic and browser regressions for identity navigation and honest data coverage.
- No stored-schema migration, automated learning or program changes.

# v2.5.0 — Decision performance and attribution

- Added a read-only, lift-filtered Decision Performance dashboard for live athlete feedback.
- Report acceptance, modification, ignore and uniquely observed next-exposure coverage.
- Compare observed capacity and effort by recorded response without implying causation.
- Surface recommendation-to-chosen-direction patterns and original evidence/workout links.
- Deduplicate multiple decisions leading to the same lift/workout: latest prior decision gets the outcome; overlapping events remain auditable but are not independent results.
- Show pending, beyond-window and overlapping events separately with descriptive data-coverage labels.
- Exclude future-dated feedback and workouts from as-of analysis.
- Add synthetic tests and browser coverage for overlapping decisions and lift filtering.
- Roll the offline cache to v2.5.0; no stored-schema migration or automated training changes.

# v2.4.0 — Athlete decision feedback

- Added Accept / Modify / Ignore controls to today's live Decision Center recommendations.
- Modify records the athlete's chosen Increase / Hold / Reduce direction plus an optional reason.
- Added a local `decisionEvents` history with schema v16 migration.
- Preserve the recommendation snapshot shown at response time for later auditing.
- Automatically link saved responses to the next usable exposure for the same saved competition-lift identity.
- Added expandable Decision history with observed next-exposure capacity and RPE outcomes.
- Historical replay does not allow feedback entry, protecting the dataset from hindsight contamination.
- Added unit and browser tests for feedback recording, response updates, outcome identity linkage and historical read-only behavior.
- Updated the in-app privacy summary to include decision responses/history as local data.
- Rolled the service-worker cache to v2.4.0.
- No automatic threshold learning, confidence score, program rewrite or exact-load recommendation.

# v2.3.0 — Decision backtesting and calibration foundation

- Added a read-only walk-forward backtest engine for historical decision replay.
- Default backtests use as-recorded historical knowledge to reduce future-data leakage.
- Evaluate each historical decision against the next usable competition-lift exposure rather than historical programming choice.
- Added decision counts, abstention rate, outcome coverage, next-capacity response, Increase/Reduce follow-up metrics and warning-miss tracking.
- Made decision thresholds explicit and replayable through sensitivity analysis.
- Added explicit historical cutoffs in addition to exposure-date replay.
- Added synthetic regressions for future-leakage protection, outcome evaluation and threshold sensitivity.
- Loaded and cached the backtest module in the app shell for future developer-facing reporting.
- Rolled the service-worker cache to v2.3.0.
- No stored-schema migration, confidence percentage, automatic optimization or training-data rewrite.

# v2.2.0 — Decision workflow

- Extended each squat, bench and deadlift decision with deterministic **Next exposure** guidance.
- Added a **Watch next** condition that explains what future evidence would support changing direction.
- Kept exact loading outside the decision engine so demonstrated capacity stays separate from programming prescription.
- Updated the Decision Center to show action guidance before deeper evidence.
- Versioned the decision-engine output contract to 3.
- Rolled the service-worker cache to v2.2.0.
- No stored-schema migration or automatic workout/program changes.

# v2.1.4 — iOS date input fix

- Reset iOS Safari's intrinsic date-input width so date controls stay inside cards and grid columns.
- Preserve native date-picking behavior while capping logical width to the parent container.
- Add a mobile regression for visible date inputs across workout, progress, measurements, decisions and tools screens.
- Roll the service-worker cache to v2.1.4.
- No stored-schema migration or data rewrite.

# v2.1.3 — Responsive form controls

- Added a shared max-width/min-width contract for inputs, selects and textareas so controls cannot overflow their cards.
- Allowed form children inside flex and grid layouts to shrink correctly on narrow screens.
- Tightened mobile layouts for template selection, history search and compact form grids.
- Added a browser regression that checks visible controls across primary app screens at mobile width.
- Rolled the service-worker cache to v2.1.3.
- No stored-schema migration or data rewrite.

# v2.1.2 — More menu and disclosure polish

- Restyled the mobile More sheet with the same card, spacing and dark-mode language used across Loadnote.
- Added short descriptions for Food, Calendar, Measurements, Photos, Tools and Gym mode.
- Updated the Decisions/Coach disclaimer to describe training-support limits and the need for user judgment.
- Updated the in-app privacy summary for the current local-first decision-support model and optional AI requests.
- Rolled the service-worker cache to v2.1.2.
- No stored-schema migration or training-data rewrite.

# v2.1.1 — Progress and Decisions hierarchy

- Added a compact Progress overview for recent sessions, saved records and body-progress destinations.
- Kept Training Review available but behind its existing collapsed disclosure.
- Reordered Decisions so recommendation cards appear before readiness diagnostics.
- Moved readiness metrics into an expandable evidence-audit layer while preserving role mapping and evidence-contract controls.
- Rolled the service-worker cache to v2.1.1.
- No stored-schema migration or automatic training changes.

# v2.1.0 — Simplified navigation and Decision Center

- Reorganized mobile navigation around Home, Train, Progress, Decisions and More.
- Moved Food to More while preserving the full nutrition workflow.
- Moved Training Review out of Home and into Progress alongside personal records.
- Reframed AI Coach as Decisions and made the Decision Center the default view; insights, chat, goals, athlete profile and program tools remain available.
- Moved Decision Readiness / Next Decision above legacy program controls so recommendations are seen before configuration detail.
- Rolled the service-worker cache to v2.1.0 so installed clients receive the information-architecture update.
- No stored-schema migration or automatic training changes.

# v2.0.1 — Browser decision integration

- Loaded the v2 decision engine in the browser and added it to the offline app-shell cache.
- Added a read-only Next Decision section to Coach → Programs using the same analysis date and replay mode as Decision Readiness.
- Show Increase, Hold, Reduce, or Insufficient evidence with plain-language reasons, latest evidence and expandable supporting signals.
- Rolled the service-worker cache so installed clients can detect and apply the update.
- No automatic workout, schedule or program changes.

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
