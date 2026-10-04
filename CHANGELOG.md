# v2.94.0 — Individualized Workload Reviews

Four-week muscle-workload comparisons, planned versus completed evidence, reviewed direct-set ranges and restrictions, conservative gather/hold/review findings, and shared muscle-specific Coach follow-ups. Schema 26 adds revisioned workload profiles; unsigned build 29400. No automatic program edits. See `docs/releases-v2.94.md`.

# v2.93.0 — Shared Training Knowledge

Confirmed muscle mappings, seven-day direct/indirect workload with effort gaps, and shared read-only hypertrophy, athletic-training and weightlifting explanations in Decisions, Coach and Companion. Optional catalog metadata; existing schema 25 retained. Unsigned build 29300. See `docs/releases-v2.93.md`.

# v2.92.0 — Conversational Local Coach

Shared local explanations with bounded follow-up context, fresh mapped-lift evidence, distinct benchmarks, accessory/RPE/program context and clear capability limits. Offline conversation history and clear-session controls; read-only training state. Schema 25 unchanged; unsigned build 29200. See `docs/releases-v2.92.md`.

# v2.91.0 — Complete Session Programming

Reviewed accessory selection, reported-priority suggestions, purposes, explicit equipment/loads, rep ranges, timed holds and conditioning in both program builders. Combined time limits and separate workload reports; deload reductions and meet peak/taper exclusions. Immutable Calendar/backup integration and independent lift-review guards. Schema 25 unchanged; unsigned build 29100. See `docs/releases-v2.91.md`.

# v2.90.0 — Mobile Reliability & Recovery

Persistent draft failure/retry, reviewed workout save status, latest-write save health, background training-data retry, acknowledged update checkpoints and clearer backup boundaries. Offline interruption, legacy draft and failed commit/retry regressions. Schema 25 unchanged; unsigned build 29000. See `docs/releases-v2.90.md`.

# v2.89.0 — Mobile UX & Accessibility

Contextual logger names and unit state, inline invalid-field alerts, keyboard tabs/skip link and mobile target sizing. Regression coverage for small viewport, larger text and reduced motion. No training, schema or signing changes. See `docs/releases-v2.89.md`.

# v2.88.0 — Native Release Validation

Cloud Android unsigned release compilation with compiled APK checks, native backup/restore and failure regressions, and an explicit physical-device acceptance procedure. Schema v25 and training behavior unchanged. See `docs/releases-v2.88.md`.

# v2.87.0 — Beta Onboarding & Data Safety

Native-local welcome, reviewed browser-to-app restore guidance, honest backup checklist and privacy-minimal save diagnostics. Browser onboarding, schema v25 and training logic unchanged. See `docs/releases-v2.87.md`.

# v2.86.0 — Cloud iOS Compilation

Add shared App scheme and GitHub macOS simulator/device-SDK unsigned compilation with compiled-bundle checks and diagnostic artifacts. No Apple credentials, signing, device launch or distribution. Normalize the generated Windows Gradle wrapper's Git line endings without changing its commands. Schema v25 and training behavior unchanged. See `docs/ios-cloud-build.md`.

# v2.85.0 — Native Beta Foundation

Unsigned Android/iOS source projects, existing Loadnote branding, explicit JSON/photo share-sheet backups, local-only native account boundary and source-configuration CI checks. Native builds, device acceptance, signing and store submission remain uncompleted. Schema v25 and training calculations unchanged. See `docs/native-beta.md`.

# v2.84.0 — Store Readiness Foundation

- Make Today the primary Home workout action; retain training summaries and plan previews without a competing Start button.
- Suppress empty-log onboarding when recoverable work or today's scheduled session exists.
- Recover drafts linked to another date before starting new scheduled work.
- Refresh cached Home when a draft is created, edited or cleared without a saved-data revision.
- Preserve Companion quick-question DOM nodes when live context changes do not change available questions.
- Remove duplicate Start empty workout controls from the Train launcher.
- Synchronize release/lockfile metadata and repair documented asset/mobile commands.
- Add draft-priority, control-stability and release-consistency regression coverage plus an explicit native/store-readiness checklist.
- Preserve schema v25, kg storage, training calculations and athlete approval boundaries.

# v2.75.0 — Execution-First Workout Screen

- Shift the Log screen into an execution-first presentation after meaningful workout work exists or a scheduled/started session is active.
- Keep manual setup unchanged before execution begins and keep historical workout editing in the full editor.
- Move date, notes, templates, session-intent setup, add-exercise controls, clear/save-template controls, and legacy rest controls behind **Workout options** during execution.
- Keep the current exercise expanded while completed and later exercises collapse into compact summaries; athletes can reopen any collapsed exercise.
- Emphasize the current set and visually quiet completed/later sets without changing saved values.
- Use the sticky training cockpit as the single primary Finish/Review action while execution mode is active.
- Surface active rest timing in the cockpit with countdown, pause/resume, +30 seconds, and stop controls.
- Keep mobile current-set/rest access while suppressing the duplicate mobile Finish action in execution mode.
- Preserve workout drafts, exercise reordering/swap/remove tools, session-deviation notes, rest persistence, reviewed prescriptions, schema v25, internal kg storage, and all training/adaptive calculations.

# v2.74.0 — Frictionless Training Mode

- Add a sticky in-workout cockpit with current session, exercise/set position, live set progress, and elapsed time when session timing is available.
- Pair the current planned set with the matching set from the athlete's previous exact exercise exposure.
- Add **Use target** for the current set; it fills captured load plus reps/hold duration while leaving actual RPE blank.
- Add display-unit load nudges: ±1.25/2.5 kg or ±2.5/5 lb. The existing logger still owns conversion back to internal kg storage.
- Keep automatic focus between sets of the same exercise, but pause at exercise boundaries with a lightweight **Up next** transition and one-tap **Start next exercise** action.
- Route Today/Resume into the focused training cockpit instead of the top of the full workout form.
- Keep scheduled-workout **Why?** context available from the cockpit through the existing approved-target explanation.
- Preserve draft recovery, rest timing, workout review/save, immutable planned-work snapshots, schema v25, and all existing training/adaptive calculations.

# v2.73.0 — History & Data Reliability Polish

- Expand Workout History search to exercise names, notes, session roles, and session goals.
- Add date, source, record-status, and newest/oldest filters while keeping bounded history pagination.
- Label saved sessions by origin: Calendar-linked, planned manual, repeated workout, or manual.
- Add a compact History reliability summary with saved-session count, current review flags, possible duplicate groups, and last recorded JSON-backup date.
- Detect exact same-day/content duplicate workout candidates without deleting, merging, or rewriting athlete history automatically.
- Warn in workout review before saving an exact duplicate while preserving the athlete's ability to save an intentional second session.
- Replace the long JSON-import confirmation with a structured in-app review showing backup fingerprint status, current training-data health, record-link health, and collection-by-collection replacement counts.
- Keep current data unchanged until the athlete explicitly confirms replacement; continue creating an automatic recovery snapshot before import.
- Refresh History backup status immediately after JSON export.
- Preserve schema v25, internal kg storage, RPE/e1RM/training-max logic, program progression, and adaptive policy.

# v2.72.0 — Progress That Explains Training

- Replace the default Progress analytics presentation with a compact story organized into Overview, Strength, Adherence, and Program history.
- Add selectable 8-, 12-, and 24-week evidence windows without changing saved workout data.
- Build movement stories from actual logged load/reps/RPE evidence, keeping exercise identities and variations separate; feature confirmed competition lifts first and let the athlete explore any logged rep-based strength exercise.
- Require at least two demonstrated-capacity days in both the start and recent comparison windows, then compare median daily capacity evidence before showing higher/lower/similar direction so one unusual session has less influence.
- Show best recent sets, recent demonstrated-capacity estimates, four-week volume, average logged RPE, and linked exercise details.
- Show current reviewed-program context and program-to-date resolved-session adherence when available.
- Keep adherence defined as completed / (completed + explicitly skipped); unresolved, upcoming, and cancelled sessions are not counted as failures.
- Add an accepted-decision timeline from stored weekly/phase review history, including kept plans and changed future prescriptions, without claiming causation.
- Preserve all existing training policies, RPE/e1RM/training-max calculations, internal kg storage, and schema v25.

# v2.71.0 — Adaptive Handoff & Change Transparency

- Add a deterministic post-session handoff model that classifies the next step as unchanged, review available, updated, or no later workout.
- Show paired target-versus-actual RPE evidence alongside planned-set completion and exact load/rep matching after save.
- Keep single-session saves evidence-only unless the existing weekly/phase lifecycle says a review window is open.
- Surface the existing weekly or phase review directly from the post-workout handoff instead of implying an automatic adaptation.
- When an athlete-approved review has changed the next session, show the stored before/after prescription and the existing evidence-based adaptation explanation.
- Deep-link **View next workout** into the reviewed program session when available, otherwise route to Calendar.
- Preserve explicit athlete approval, immutable reviewed source prescriptions, current Calendar revisions, local-first behavior, kg storage, and all existing training-policy thresholds.
- No schema migration; schema remains v25.

# v2.70.0 — Gym-Floor Training Experience

- Make the daily training path more direct: Today can preview the exact reviewed program workout and includes estimated session time when available.
- Deep-link the program viewer to an individual session so the relevant week and workout open automatically.
- Add live set/exercise progress to the mobile gym-floor dock and switch the finish action to Review when entered work is complete.
- Add one-tap **Same as set N** quick fill for blank strength sets; it copies load plus reps/hold duration only and never copies RPE or completion.
- Make the workout progress line identify the next exercise/set.
- Add a concise post-save plan-vs-actual execution summary with Done and View next workout actions.
- Preserve local-first draft recovery, same-day scheduled-workout start guardrails, immutable reviewed prescriptions, and separate actual performance evidence.
- No schema or training-policy change; schema remains v25.

# v2.69.2 — Program Workout Viewer & Calendar Integration

- Add a first-class **View workouts** action to the reviewed current-program lifecycle on Home and Coach.
- Group the full reviewed program by week and phase, including event-only meet weeks that contain no ordinary training session.
- Show the current scheduled prescription for each workout: exercises, sets, reps/holds, displayed load, calculated % training max when source context is available, and target RPE.
- Preserve the immutable reviewed program as context for training max, lift role, set format and prescription purpose while treating the current Calendar revision as the authority for load/reps/RPE.
- Show linked completed-workout evidence without replacing or rewriting the planned prescription.
- Integrate future scheduled workouts into Calendar date cells and Selected day details before the workout has been performed.
- Keep manual/legacy Calendar sessions supported; program metadata is enriched only when the scheduled session belongs to a reviewed lifecycle program.
- Route scheduled meet-cycle **View current program** actions directly into the same workout viewer.
- Keep workout-start rules unchanged: a future scheduled session can be inspected at any time but must still be rescheduled to today before it can be started.
- Add deterministic model and browser coverage for phase programs, meet cycles, event weeks, current schedule revisions, mobile layout and future Calendar visibility.
- No stored training-data or training-policy change; schema remains v25.

# v2.69.1 — Current Program Visibility Hotfix

- Treat the scheduled reviewed program lifecycle as the canonical current/upcoming training plan even when the legacy `programs` library is empty and `activeProgramId` is null.
- Refresh Home, Today/Train and Coach current-program surfaces immediately after a meet-prep cycle is scheduled.
- After scheduling, return the athlete to the current-program card instead of leaving the newly accepted plan buried in setup tools.
- Add a **View current program** action to already scheduled meet-cycle records.
- Show program dates and the next scheduled session on the current-program lifecycle card.
- Refresh the lifecycle card before the Program planner's **View current program** route scrolls to it.
- Relabel the older generated-program area as a legacy generator selection/library so its `activeProgramId` state is not confused with the reviewed current program.
- Coach reminders now prefer the reviewed scheduled lifecycle and only describe the old generator selection as legacy.
- Add unit and browser regressions for the exact state seen in the September 30 export: scheduled meet cycle present, scheduled sessions present, legacy `programs: []`, and `activeProgramId: null`.
- No training-policy, scheduling-rule, weight-unit or schema change; schema remains v25.

# v2.69.0 — Decisions-Driven Program Planning

- Add deterministic `program-planning-decision-v1` as the authority for meet-prep timeline arithmetic and phase allocation.
- Make the reviewed start week + event date determine total prep length automatically; remove the normal need to enter a separate week count.
- Reject timelines shorter than the supported seven-week minimum instead of silently compressing accumulation, strength, peak, taper and event week.
- Reserve the event week, one taper week and a bounded peak automatically, then allocate the remaining base weeks between accumulation and strength.
- Reuse frozen transition/block objectives first, then frozen starting-prescription evidence/recent consistency, then the existing conservative 55/45 base split.
- Keep long-phase holds explicit when accumulation or strength exceeds the six-week progressive engine window.
- Move manual phase lengths under an advanced **Customize phase lengths** control; overrides must still sum exactly to the date-derived timeline.
- Freeze whether the approved structure was Decisions-calculated or athlete-customized, plus evidence source, reasons and deterministic fingerprints.
- Record `programPlanning: program-planning-decision-v1` in new meet-cycle decision environments.
- Show the frozen planning decision in the Cycle Journal and audit its config/fingerprint/policy lineage.
- Keep profile event date as a default rather than a second source of truth.
- Preserve existing hard constraints, quality-gate review, athlete approval and separate scheduling.
- Preserve older meet cycles without planning-decision metadata.
- No adaptive-threshold or top-level schema change; schema v25 remains unchanged.

# v2.68.0 — Programming Workspace Simplification

- Replace multiple equally prominent programming builders with one deterministic **Program planner** as the primary Coach → Programming entry point.
- Route athletes from saved context to one next action: training setup, quick return block, main Program designer, guided meet prep, reviewed cycle, current program, or existing-program adoption.
- Collapse Training setup, Quick 4-week return block, Program designer and program adoption under **Program setup & alternate tools** so they do not all compete for attention.
- Reposition the legacy four-week builder as **Quick 4-week return/base block** instead of a general peer to the longer program designer.
- Rename the phase-based UI to **Program designer** while preserving its existing reviewed accumulation → strength → deload engine.
- Add a guided meet-prep path that saves reviewed lift setup and can continue directly into the full Meet timeline.
- Treat the programming-profile event date as a planning default rather than requiring the full meet cycle to match it exactly.
- Change phase setup event-date overlap from a hard failure to an explicit warning when the standalone sequence is being used as lift setup.
- Allow an explicitly reviewed meet-cycle event date to override the profile event-date default with a visible warning.
- Re-run hard profile constraints before scheduling without requiring byte-for-byte profile snapshot equality; soft note/event-default edits no longer invalidate otherwise compatible reviewed plans.
- Continue blocking scheduling when current available days, time, equipment, avoided exercises or exercise-role mappings are incompatible.
- Let non-Monday start intent in the Program designer and quick return builder automatically align to the next Monday instead of failing validation.
- Prefill meet-cycle length/date from the profile event date when it maps cleanly to the supported 7–52 week timeline.
- Add desktop/mobile browser coverage for the single-path workspace, collapsed alternate tools and Sunday-to-Monday start alignment.
- Add `docs/programming-workspace.md`.
- No training-policy or top-level schema change; schema v25 remains unchanged.

# v2.67.0 — Program Simulation & Pre-Cycle Quality Gate

- Add a deterministic whole-cycle quality gate before meet-cycle approval.
- Classify generated cycles as **pass**, **review**, or **blocking** instead of assigning an opaque program score.
- Verify cycle length, phase counts, final event alignment, empty event week, session week/date integrity and absence of training on/after the event date.
- Verify every generated set remains positive, at or below the supported 85% training-max ceiling and within a valid RPE-cap range.
- Compare estimated workout duration with the athlete-reviewed session budget; over-budget sessions block approval and sessions at 90%+ of the budget require review.
- Audit within-phase exposure/set continuity and phase-transition set/load changes without automatically rewriting the program.
- Require exactly one primary competition-lift exposure per lift in every non-event training week; missing/duplicate primaries block approval.
- Require peaking and taper work to stay on the reviewed competition lifts; late-cycle variation work or a missing competition-lift exposure blocks approval.
- Review taper set/loading reduction against the final peak week and surface repeated multi-week taper doses instead of implying individualized taper optimization.
- Surface same/adjacent-day hard primary squat/deadlift spacing as a review item, not a recovery diagnosis.
- Surface accumulation/strength phases extending beyond the six-week progressive engine window because the generator intentionally holds the final supported prescription instead of extrapolating indefinitely.
- Expand the full-cycle preview with gate status/findings, workout/time range, weekly lift frequency, set counts, average planned %TM and competition-specific set percentage.
- Freeze the quality-gate snapshot and `program-quality-gate-v1` policy identity on newly reviewed meet cycles.
- Surface the saved gate status in the Cycle Journal and audit its fingerprint/count/policy lineage without recomputing or rewriting the approved result.
- Preserve legacy meet cycles without quality-gate snapshots.
- Add deterministic 8/12/16/20-week simulations spanning 3-day/5-day schedules, intermediate/advanced profiles, sparse history, kg/lb display and mock/competition events.
- Keep v2.65 adaptive thresholds unchanged and introduce no automatic correction or approval behavior.
- Add `docs/program-quality-gate.md`.
- No top-level schema migration; schema v25 remains unchanged.

# v2.66.0 — Cycle Observability & Reproducibility

- Freeze an additive decision environment on newly reviewed phase programs and meet cycles: release version, schema version, capture time, record purpose and explicit policy identities.
- Freeze the exact deterministic cycle-controller recommendation displayed before every normal v2.66 weekly-review approval.
- Keep the controller recommendation separate from the athlete's lift-by-lift approved choices so accepted recommendations and athlete overrides remain distinguishable.
- Advance meet-cycle weekly-review records to version 5 while retaining the existing `cycle-week-adjust-v4` training policy and validation compatibility for older review versions.
- Freeze the weekly review evidence fingerprint, controller-input fingerprint and recommendation fingerprint for deterministic replay/audit.
- Constrain controller response inputs to the exact weekly-review knowledge cutoff and current phase; later data cannot silently become part of the historical recommendation.
- Add read-only controller replay that reports a mismatch instead of rewriting an older recommendation when current deterministic code no longer reproduces it.
- Add a read-only Cycle Journal assembled from existing program, review, Calendar, workout, event and transition records instead of creating a duplicate event database.
- Show recommendation → athlete choice → Calendar effect → later competition-lift evidence as separate concepts.
- Require exact scheduled-session, Calendar-revision, date and prescription lineage before later workout evidence is attributed to a saved weekly decision.
- Preserve awaiting, unobserved, revised/deviated and observed outcome states separately; missing evidence is never treated as a measured zero.
- Carry frozen v2.66 controller snapshots into immutable meet-cycle transition baselines for later handoff analysis.
- Add decision-data auditing for malformed/stale environments, missing v2.66 controller snapshots, fingerprint/policy identity mismatches and unknown-capacity values coerced to 0%.
- Fix a next-block objective bug where missing transition capacity change could become 0% and be interpreted as a flat response.
- Fix a related next-block objective bug where missing recent average RPE could become 0 and make positive capacity evidence look like clearly manageable effort.
- Harden starting-prescription numeric normalization so null/empty values remain unknown rather than numeric zero.
- Add deterministic unit/browser coverage for replay, future-data isolation, athlete override preservation, exact outcome lineage and null-vs-zero regressions.
- Add `docs/cycle-observability.md`.
- No new progression heuristic and no top-level schema migration; schema v25 remains unchanged.

# v2.65.0 — Phase-Specific Cycle Decisions

- Add an explicit deterministic phase-policy layer for accumulation, strength, peaking, taper and event transitions.
- Keep all cycle changes athlete-approved and future-only; no completed workout or original cycle is rewritten.
- Make accumulation prioritize repeatable workload and use a higher adaptive-controller upward-progression evidence bar: 6 comparable competition-lift sets, 3 clearly below-cap sets and at least +2% within-phase estimated-capacity change.
- Preserve the planned accumulation → strength intensity transition by withholding any extra upward increment at the boundary.
- Keep strength-phase upward progression at the existing stricter competition-specific rule: 4 comparable competition-lift sets, 2 clearly below cap and at least +1% within-phase estimated-capacity change.
- Restrict strength → peaking to keep or a bounded one-increment downward load review from competition-lift evidence; no added load or set-count change is offered.
- Allow peaking → peaking only keep or a one-increment downward competition-load review when at least 2 directly comparable peak sets exceed their approved RPE caps.
- Do not require a multi-week capacity trend for that peak correction because short peaks may not contain enough dated evidence.
- Prevent learned action-history patterns from steering peaking corrections across phases.
- Protect taper and event-week prescriptions from adaptive escalation or replacement.
- Store the resolved phase policy in new weekly-review reports for auditability.
- Advance weekly-review records to version 4 / `cycle-week-adjust-v4` while preserving v1–v3 validation.
- Advance the adaptive controller to `cycle-adaptive-v5`.
- Missing capacity trend remains unknown rather than being coerced to zero.
- Add UI explanation of the active phase policy and allowed review actions.
- Add deterministic policy/controller/review tests plus browser coverage.
- Add `docs/phase-specific-decisions.md`.
- No top-level schema migration; schema v25 remains unchanged.

# v2.64.0 — Evidence-Backed Starting Prescription Intelligence

- Add a deterministic 28-day starting-prescription evidence model for confirmed squat, bench and deadlift identities.
- Keep competition-lift and confirmed close-variation workload evidence separate from competition-lift capacity evidence.
- Require at least three matching exposure dates spanning 14 days before recent frequency is treated as a supported starting reference.
- Derive a bounded 1–3 exposures/week suggestion from recent matching exposure frequency.
- Derive a bounded 2–4 sets/exposure suggestion from recent 3–8 rep development work; apply the 25% weekly-set guardrail only when all four recent seven-day windows contain matching work so missing weeks are not treated as low tolerance.
- Keep the default weekly progression suggestion at 1 percentage point of training max and allow only a conservative reduction to 0.5 when recent matching-set effort is high or supported competition-lift capacity direction is lower.
- Explicitly prevent low RPE alone from increasing the suggested weekly progression step.
- Suggest top/back-off primary structure only after repeated recent competition-lift sessions show that pattern.
- Suggest recent compatible training weekdays only within the active programming profile.
- Add an explicit **Use evidence suggestion** action in the phase builder; all fields remain editable and athlete-reviewed.
- Compare the final selected program structure with the suggestion before save and surface differences as review prompts, not errors.
- Freeze the point-in-time starting-prescription comparison on newly reviewed phase programs for later audit/reproducibility.
- Recheck that evidence before scheduling newly reviewed v2.64 programs so changed pre-launch evidence requires fresh review.
- Keep old phase programs valid without the new additive snapshot.
- Add deterministic tests and browser coverage for evidence isolation, future-data exclusion, conservative step logic, UI application and snapshot persistence.
- Add `docs/starting-prescription.md`.
- No top-level schema migration; schema v25 remains unchanged.

# v2.63.0 — Secure Production Coach Boundary

- Route the normal consumer online Coach exclusively through the Loadnote server.
- Require an authenticated Loadnote account for production Coach requests, with the existing CSRF/session protections.
- Remove active browser-side provider API-key, base-URL, model and provider-selection code from the consumer Coach path.
- Remove obsolete historical browser Coach API keys on upgrade.
- Replace raw provider-style `messages` with a bounded contract: athlete question + recent user/assistant history + structured Loadnote context.
- Reject raw message arrays, client API keys, provider choices, models, base URLs and client-supplied system prompts at the server boundary.
- Keep the trusted Coach system prompt on the server and instruct the model to treat athlete context as untrusted data, never instructions.
- Bound Coach question/history/context sizes before provider requests.
- Normalize provider timeouts/errors instead of forwarding raw upstream payloads.
- Parse and validate the provider response on the server; the browser receives only the structured Coach result.
- Make Coach output fields bounded and typed, including a kg-only `weightKg` recommendation field.
- Make all training-context weight fields explicit kilograms while preserving display unit separately.
- Add current athlete goals and active-program lifecycle state to structured Coach context.
- Keep AI guidance advisory-only; no Coach response directly mutates workouts, programs or deterministic adaptive logic.
- Keep offline deterministic Coach guidance available for signed-out/offline use.
- Update privacy copy to describe exactly what online Coach sends and does not persist in the account snapshot.
- Add backend, client and browser tests for prompt ownership, provider-secret isolation, CSRF/auth, unit safety, legacy-key cleanup, fallback behavior and consumer request shape.
- No training-data schema migration; schema v25 remains unchanged.

# v2.62.0 — Gym-Floor Mobile Polish

- Add a compact mobile workout dock with the current set, recoverable rest timer and Finish action.
- Keep the dock tied to the visible Train logger and hide it when the mobile keyboard is likely covering the viewport.
- Mark the mobile Train destination when an unfinished workout draft is saved on-device.
- Add mobile input modes and Enter-key hints for load, reps/hold duration and RPE.
- Allow Enter on a valid RPE to complete the set through the existing quick-entry path.
- Advance after completion to the next unfinished set, including a blank manually-added set, without auto-completing or inventing values.
- Show matching previous-session evidence beside each strength set.
- Add explicit **Use last** for blank sets, copying only prior load and reps/hold duration.
- Convert previous stored kg into the current display unit at the UI boundary; do not copy prior RPE or completion state.
- Keep previous-performance context read-only until the athlete explicitly chooses Use last.
- Protect entered sets/exercises from single-tap deletion while leaving blank-row removal immediate.
- Enlarge destructive set touch targets and tighten 390px/gym-mode logger layout.
- Preserve draft recovery, rest-timer recovery and local workout saving across navigation/reload.
- Add an offline-save browser regression proving a loaded workout does not require network access to save locally.
- Add Node/browser coverage for input semantics, previous-set reuse, next-set progression, dock/navigation behavior, draft recovery, destructive-action protection and 390px overflow.
- No training-data schema migration and no change to adaptive programming logic.

# v2.61.0 — Active Program Lifecycle

- Add one deterministic lifecycle controller for scheduled phase programs and mock/competition meet cycles.
- Resolve one current program context with explicit overlap detection instead of guessing when reviewed programs collide.
- Track current week, phase, scheduled-session resolution, event state, transition state and next-block handoff from existing stored records.
- Use the same next-action state on Home, Coach and post-workout continuity.
- Surface timely weekly/phase review actions before future work only while the existing future-only adjustment window remains legally usable and the reviewed period is fully resolved.
- Keep missed historical review windows visible as nonblocking audit context instead of forcing stale reviews or retroactively changing training.
- Preserve unresolved prior scheduled sessions as blockers until the athlete explicitly resolves or logs them.
- Guard scheduled program workout start when an actionable review still owns the next step; do not create a competing adaptation rule.
- Add direct lifecycle routing into the existing weekly review, phase review, event-result, transition-baseline and next-program handoff experiences.
- Extend immutable transition baselines to scheduled meet cycles, including weekly-review history and athlete-entered event evidence.
- Keep event results separate from estimated capacity, known/tested 1RM and training max in transition evidence.
- Let goal-aware block objectives and next-program handoff consume completed meet-cycle transitions.
- Keep new meet-cycle transition records at record version 1 with additive metadata for rollback compatibility.
- Add Node and browser regression coverage for lifecycle ordering, overlap refusal, timely/missed review windows, event closure, handoff, mobile layout and shared Home/Coach state.
- No training-data schema migration and no new programming-progression heuristic in this release.

# v2.60.0 — Consumer Profile & Onboarding

- Make **Home → Train → Progress → Coach → Profile** the five primary consumer destinations on desktop and mobile.
- Group Calendar, Food, Measurements, Photos and Tools beneath Profile instead of a competing primary More destination.
- Move account sign-in, sync status, manual Sync now and sign-out from Tools into Profile.
- Add a compact Profile hub for training setup, account/sync, weight-display preference, Gym mode, appearance and secondary destinations.
- Reuse the existing revisioned programming profile for training setup rather than creating duplicate athlete settings.
- Surface current powerlifting competition-lift mapping coverage in Profile and hand off to the existing confirmed mapping workflow.
- Replace demo-oriented first-run tips with setup → train → optional account guidance.
- Add self-service account deletion behind authenticated CSRF protection.
- Delete the durable account identity and account-scoped remote structured-training snapshot while leaving local device training intact unless separately erased.
- Clear the initiating device's acknowledged sync base and remote receipt after successful account deletion.
- Add Node/backend/browser coverage for account-store deletion, remote-snapshot deletion, client CSRF handling, Profile deletion behavior, onboarding, primary navigation and secondary-destination access.
- No training-data schema migration in this release.

# v2.59.0 — Safe Account Sync

- Add explicit **Sync now** for signed-in accounts while keeping workout logging and core training fully local/offline.
- Persist a trustworthy per-account shared sync base as a device-only IndexedDB record rather than placing sync metadata inside the account snapshot.
- Compare Shared Base ↔ This Device ↔ Cloud with the existing deterministic v2.55 three-way merge rules.
- Automatically combine only safe one-sided or identical changes; never use timestamp/last-write-wins to hide concurrent edits.
- Add explicit record-level conflict review with **Keep this device** / **Keep cloud** choices for true concurrent changes.
- Treat a device with existing divergent cloud data but no shared base as a first-link review instead of guessing how to merge; require an explicit whole-device/cloud starting choice.
- Preserve device-local settings, drafts, photos, recovery snapshots and provider/API configuration when applying incoming structured account data.
- Create a bounded local recovery snapshot before incoming cloud training is applied.
- Re-run workout/Calendar relationship integrity after merges and refuse combinations that would create invalid linked training records.
- Recheck the remote package/revision immediately before pull-only local application; uploads continue to use server compare-and-swap revisions and stale writes stop for a fresh review.
- Fix merge application so downloaded sync-project snapshots apply selected remote records correctly rather than being interpreted as missing flat-state collections.
- Keep progress-photo binaries and background synchronization out of v2.59; sync is intentionally user-initiated.
- Add unit and browser coverage for first upload, first-link safety, shared-base merges, explicit conflicts, projected remote packages, recovery-backed cloud application and stale-revision handling.
- No training-data schema migration in this release.

# v2.58.0 — Account-Scoped Remote Training Storage

- Add authenticated, account-scoped storage for verified `loadnote-sync-v1` structured-training snapshots without enabling automatic synchronization.
- Add a monotonic per-account remote revision beginning at 0 (empty) and incrementing exactly once for each different accepted snapshot.
- Require compare-and-swap `expectedRevision` writes. Stale different snapshots receive `409 revision_conflict` instead of overwriting newer remote training data.
- Make exact-package retries idempotent so a mobile/network retry can recover from an ambiguous successful commit without creating a duplicate revision.
- Reuse the v2.55 sync-package manifest and add stricter server-grade verification: exact protocol collection/document sets, bounded metadata, fingerprint verification and blocking workout/Calendar relationship checks.
- Verify persisted remote packages again on read and fail closed when stored snapshot contents, metadata or revision history are inconsistent.
- Keep account scope server-derived from the authenticated Loadnote session; client-supplied account identifiers are ignored for authorization.
- Add `GET /api/sync/status`, `GET /api/sync/state` and CSRF-protected `PUT /api/sync/state`.
- Keep lightweight status separate from the full remote package so normal account UI does not download training history just to show storage state.
- Add a separate bounded sync-body limit (8 MiB default, 32 MiB hard maximum) while progress photos remain outside the structured sync protocol.
- Add a single-process file-backed remote store with atomic replacement, hashed account filenames, restrictive file permissions where supported and bounded revision metadata history.
- Add an explicit browser remote-sync client for status, verified download and revision-checked upload. These helpers do not automatically apply remote data or mutate local training state.
- Show read-only remote storage status in the Account panel while explicitly stating that automatic sync is off.
- Add deterministic unit/integration/browser coverage for revisions, idempotency, account isolation, persistence, corruption detection, CSRF, stale-write conflicts, remote package verification and nonmutation of local training state.
- Add `docs/remote-training-storage.md` plus environment, privacy, testing, sync and mobile-readiness documentation updates.
- No training-data schema migration, automatic upload/download, local remote-data application, conflict-resolution UI, background sync, photo cloud storage or multi-instance transactional database in this release.

# v2.57.0 — OIDC Identity & Persistent Account Store

- Connect the v2.56 signed-session boundary to a real provider-neutral OpenID Connect authorization-code flow.
- Add OIDC discovery, S256 PKCE, signed short-lived state/nonce flow cookies, server-side authorization-code exchange, RS256 ID-token verification against provider JWKS, issuer/audience/authorized-party/time/nonce/subject validation, and one-time JWKS refresh for ordinary signing-key rotation.
- Support confidential clients through advertised `client_secret_basic` or `client_secret_post` methods, while allowing public PKCE clients without a client secret.
- Add a durable single-instance account/identity store with atomic file replacement, startup validation, restrictive file permissions where supported, stable provider-subject mappings, verified-email handling, display-name/avatar metadata and restart persistence.
- Require authenticated production deployments to configure an explicit account-store path and OIDC provider instead of silently launching an unusable account boundary.
- Add `/api/auth/providers`, `/api/auth/login` and `/api/auth/callback`; resolve verified provider identities to Loadnote accounts before issuing the existing application session.
- Keep provider subjects and provider tokens server-side. Email remains profile metadata, never the account identity key.
- Add a compact consumer Account section with sign-in, signed-in account status and sign-out while clearly stating that workout history is still local and cloud training sync is not enabled yet.
- Preserve HttpOnly Loadnote sessions and in-memory CSRF handling; no session credential is written to localStorage.
- Restrict the built-in backend static server to known consumer assets so environment templates, backend source, tests, docs and local account data are not web-served.
- Add deterministic unit/integration/browser coverage for durable account resolution, verified profile metadata, OIDC PKCE/state/nonce/JWKS verification, persisted account sessions across server restarts, protected static files and account UI.
- Add `docs/oidc-account-store.md` and expand backend environment configuration for the provider/account-store boundary.
- No training-data schema migration, cloud workout storage, automatic sync, account linking, password authentication, multi-instance transactional account database or provider provisioning is introduced in this release.

# v2.56.0 — Account Identity & Authentication Foundation

- Add a server-side account/session layer that separates trusted identity verification, stable Loadnote account identity, Loadnote application sessions and protected account-scoped APIs.
- Derive opaque account IDs from verified provider + provider-subject identity rather than email, and keep account identity stable across session-signing-key rotation.
- Add short-lived signed Loadnote sessions with audience/version checks, unique session IDs, expiration, HttpOnly web cookies and per-session CSRF tokens.
- Keep signed session credentials out of localStorage. The browser account-session client stores only non-secret session status and CSRF state in memory.
- Add `GET /api/auth/session`, `POST /api/auth/logout` and a protected `GET /api/account` boundary.
- Add cookie-CSRF enforcement for authenticated state-changing requests and prepare bearer-session verification for later native-client work without adding persistent bearer storage.
- Route secure-backend Coach requests through the account-session client so authenticated deployments automatically include credentials and CSRF protection.
- Replace wildcard credential CORS with same-host / explicitly allowed-origin rules. Production/native cross-origin callers must be listed in `LOADNOTE_ALLOWED_ORIGINS`.
- Default production backend deployments to authenticated access. When production authentication is required, refuse startup unless `LOADNOTE_AUTH_SECRET` is at least 32 bytes.
- Add a development-only session issuer guarded by explicit environment flags and a separate development key; forcibly disable it in production.
- Remove backend URL / backend-enable controls that had leaked into the consumer custom-food UI. Developer/provider configuration remains implementation/development plumbing rather than normal consumer product UI.
- Add deterministic tests for identity stability, signed-session tamper/expiry rejection, cookie flags, CSRF, account protection, CORS rejection, production startup guardrails and client session behavior.
- Add desktop/mobile browser coverage proving authenticated Coach requests receive CSRF without persisting the session token in localStorage.
- Add `.env.example` plus `docs/auth-architecture.md` documenting production defaults, security boundaries, future identity-provider integration and the relationship to the v2.55 sync protocol.
- No schema migration, production Apple/Google/email sign-in, password storage, cloud sync, persistent account database, refresh-token store or account-management UI in this release.

# v2.55.0 — Sync-Safe Training Data Foundation

- Add `loadnote-sync-v1`, a deterministic structured-data contract for future account synchronization without adding network sync yet.
- Define stable-ID sync coverage across workouts, Calendar sessions, workout revisions, training blocks, exercise identity/roles, goals, reviewed/adopted programs, programming profiles, phase/meet records, decision history, templates, PRs, nutrition, bodyweight, measurements and other structured account records.
- Keep progress-photo binaries, recovery snapshots, API/provider configuration and device/display preferences outside the first structured sync payload.
- Add deterministic per-record manifests and full-package fingerprints so accidental mutation, truncation or stale package contents can be detected before merge planning. These fingerprints are not cryptographic authentication.
- Add sync preflight checks that block malformed collections, missing/duplicate record identities and already-broken workout/Calendar relationships instead of silently repairing data.
- Add a three-way merge planner using shared-base, local and remote state. Safe one-sided changes and identical concurrent changes can merge; divergent concurrent edits, edit-vs-delete and different same-ID creates become explicit conflicts.
- Do not use timestamp-based last-write-wins for training records.
- Preserve local record representations during safe merges so legacy ID types are not rewritten merely because a merge was evaluated.
- Re-run record-link integrity after an otherwise conflict-free merge and reject combinations that would create invalid training relationships.
- Add deterministic tests for manifest stability, package tamper detection, one-sided changes, concurrent conflicts, deletion conflicts, disjoint creates, duplicate identities and post-merge relationship failures.
- Add browser coverage proving the sync model can inspect/package current state without mutating local training data.
- Document the future authenticated sync flow, server revision/base requirements, deletion semantics, conflict policy and remaining non-goals in `docs/sync-architecture.md`.
- No schema migration, cloud account, authentication, remote storage, background sync or conflict-resolution UI in this release.

# v2.54.0 — Mobile Release Foundation

- Add a real Capacitor application configuration for the Loadnote mobile shell with `www` as the explicit consumer bundle.
- Add runtime-surface detection that distinguishes regular browser, installed standalone web app and native Capacitor execution without scattering user-agent checks through product code.
- Initialize runtime detection even on native surfaces where service workers may be unavailable.
- Opt the app shell into `viewport-fit=cover` and add installed/native safe-area handling for the app shell, toast placement, bottom navigation spacing and gym-mode controls.
- Tighten the installable web manifest around the Loadnote product identity, stable app scope/id and maskable icon support.
- Add `npm run check:mobile`: rebuild the `www` bundle, validate Capacitor/manifest configuration, ensure referenced local assets are present, verify release/cache consistency and reject server/development directories from the consumer package.
- Run the mobile bundle gate in GitHub Actions before Playwright.
- Add deterministic tests for browser/installed/native runtime detection and static mobile release configuration, plus browser coverage that verifies the active runtime marker and 44px mobile primary-navigation targets.
- Document the current mobile package boundary, development bundle identifier, native-project generation steps and what remains intentionally incomplete before a commercial store release.
- Keep AI provider secrets server-side; `backend/`, tests, GitHub workflow files and environment files are not copied into the mobile web bundle.
- No schema migration and no account, cloud-sync, payment, store-signing or push-notification claim in this release.

# v2.53.0 — Useful Progress Analytics

- Add a compact, evidence-first Training Progress section to Progress instead of another dense dashboard.
- Compare the most recent 4 weeks with the previous 4 weeks for logged sessions, completed strength sets and valid RPE coverage.
- Keep volume quantity descriptive: more sessions or sets are not labeled better or worse.
- Summarize recent scheduled-session execution with completed, explicitly skipped, unresolved and cancelled counts plus resolved-session adherence.
- Prioritize athlete-confirmed competition squat, bench and deadlift mappings for performance evidence. When no competition lifts are mapped, fall back to the three most-trained rep-based strength movements.
- Show the best RPE-aware demonstrated-capacity estimate and heaviest logged set for each featured movement while keeping the estimate separate from tested 1RM, training max and prescribed load.
- Only show a 4-week capacity-change comparison when both windows contain at least two distinct capacity-evidence days. Sparse evidence stays visible without a percentage-change claim.
- Keep all internal loads in kg and convert only at display time; changing kg/lb does not rewrite workout history.
- Link each featured movement directly to the existing Exercise Details view for deeper history.
- Add deterministic unit coverage for date windows, schedule execution, explicit competition mappings, sparse guards and fallback movement selection, plus desktop/mobile browser coverage.
- No schema migration and no automatic training/program changes.

# v2.52.0 — Data & Reliability Hardening II

- Add cross-record integrity checks for current workouts, Calendar sessions, planned-work snapshots and workout revision history.
- Detect duplicate workout identities, duplicate Calendar identities, orphan scheduled-session links, missing captured Calendar revisions, linked date mismatches, planned-work snapshot mismatches and multiple workouts linked to one scheduled session.
- Keep workout revision-history problems separate from current training: malformed/duplicate/orphan revision records are warnings unless the current workout/Calendar relationship itself is ambiguous.
- Extend Tools → Training data health with record-link integrity counts and concrete blocking/warning details.
- Gate next-block handoff on blocking workout/Calendar relationship issues in addition to current load/RPE integrity.
- Add deterministic fingerprints to new JSON backups so accidental file corruption or truncation can be detected before replacement import. Legacy backups remain supported and are explicitly labeled as unverified legacy files.
- Add deterministic fingerprints to new automatic recovery snapshots and verify them before restore. Existing legacy snapshots remain restorable.
- Expand replacement-import previews to include Calendar sessions, workout revisions, meet cycles, adopted programs and transition baselines.
- Keep the backup fingerprint explicitly non-cryptographic: it detects accidental corruption but is not authentication or tamper-proof security.
- Add deterministic and browser regressions for clean/invalid relationship graphs, corrupted backups, recovery-snapshot corruption and Tools visibility.
- No schema migration; schema remains v25 and no current workout values are rewritten automatically.

# v2.51.0 — Week-to-Week Training Continuity

- Close the core loop after workout save: show what evidence was added, what remains unresolved, and what scheduled session comes next.
- Add a deterministic continuity model that keeps saved training, Calendar state, and planned-versus-performed evidence separate.
- For linked scheduled workouts, report planned sets represented, valid strength-set RPE coverage, and whether the session was partial or modified.
- Preserve shortened or partial sessions exactly as logged instead of assuming omitted sets were completed.
- Carry the athlete's recorded deviation reason into the post-workout continuity summary when one was provided.
- Treat past scheduled sessions with no linked workout as **unresolved**, not automatically missed or skipped. Skipped and cancelled sessions remain explicitly distinct.
- Show the next unresolved scheduled workout after save, including exercise/set counts and whether it was rescheduled from another date.
- Add the same compact next-session / unresolved-session context to Home after today's training is logged or when no workout is scheduled today.
- Reuse v2.50 accepted-adaptation explanations when the next scheduled workout was already revised by a reviewed decision.
- Keep all continuity logic read-only: v2.51 does not reschedule sessions, mark sessions skipped, invent RPE, or apply a programming change automatically.
- Add deterministic unit tests plus browser coverage for shortened-session evidence, deviation context, next-session handoff, and Home continuity.
- No schema migration; schema remains v25.

# v2.50.0 — Adaptation Explanation Layer

- Add a deterministic explanation layer for athlete-approved weekly and phase programming changes.
- Explain **what changed**, **why it changed**, and the exact logged evidence that made the bounded change reviewable.
- Derive explanations from accepted review records and the exact before/after Calendar revisions instead of generating retrospective AI rationale.
- Support one-set reductions/additions and bounded load increases/reductions, including the number of affected future sessions and exact load deltas.
- Keep squat, bench and deadlift evidence separate and preserve the accepted review's original decision record.
- Show **What changed & why** on Home when today's scheduled workout was revised by an accepted training review.
- Surface the same explanation in Decisions for the next revised scheduled workout.
- Clearly distinguish recorded evidence from causal claims: explanations do not diagnose fatigue, recovery or adaptation.
- Add deterministic unit coverage for weekly/phase review explanations and browser coverage for the Today explanation flow.
- No schema migration; schema remains v25 and existing accepted review / Calendar revision history remains authoritative.

# v2.49.0 — Workout Logger Speed & Clarity

- Add a focused between-set quick-entry flow for strength sets without changing the stored workout schema.
- Highlight one active unfinished set at a time and surface a compact **Finish set · RPE** control directly on that set.
- Add one-tap RPE choices from 6–10 in 0.5 steps. Choosing an RPE records the value, marks the set complete, preserves the existing rest-timer behavior, saves the draft, and advances focus to the next entered unfinished set.
- Add **Done without RPE** so athletes can finish a set without inventing effort data. Missing RPE remains explicitly missing evidence.
- Rename **+ Add Set** to **+ Same Set** to match existing behavior: duplicate the prior set’s load/reps while leaving RPE blank.
- Compact previous-performance context to a visible one-line “Last” summary with the full set-by-set comparison behind an optional disclosure.
- Keep quick-entry state synchronized with draft saves, focus mode, completion checkboxes, exercise reordering and reload recovery.
- Add deterministic helper tests plus browser coverage for RPE completion, automatic next-set progression, draft persistence and missing-RPE preservation.
- Preserve kg/lb conversion, planned-vs-completed snapshots, workout history, revision history and schema v25.

# v2.48.0 — Today → Train first-program flow

- Add a first-class **Today** card at the top of Home so a scheduled reviewed workout is immediately visible without opening Calendar or the full weekly plan.
- Show the scheduled session name, goal, planned exercise count and planned set count, with one primary **Start workout** action.
- Detect an unfinished draft linked to today’s scheduled session and switch the Home action to **Resume workout** instead of loading a competing copy.
- Preserve unscheduled training: when no session is scheduled, Home offers a direct **Log workout** action plus Calendar access.
- After a linked scheduled workout is saved, Home reports today’s training as logged and offers workout-history/Calendar follow-up actions.
- Make scheduled-session starts date-safe: a session must be scheduled for today before it can be started. Starting a future or stale Calendar date now asks the athlete to reschedule first so planned-versus-performed evidence stays on the correct date.
- Load the scheduled prescription into the existing logger with the scheduled date, while keeping planned targets separate from actual reps/load/RPE.
- Add a small deterministic Today-state module rather than adding more logic to the legacy app.js.
- Add node and Playwright coverage for scheduled-session discovery, one-tap start, draft resume after reload, date mismatch protection and completed-session Home state.
- No top-level schema migration.

# v2.47.0 — Real-world launch hardening

- Add a deterministic training-data health audit for current strength logs. It reports invalid loads, invalid RPE values, missing-RPE coverage and extreme same-exercise load outliers without rewriting workout history.
- Treat missing RPE as incomplete evidence rather than an error or invented effort value. RPE coverage is reported separately so programming logic can remain conservative when effort data is sparse.
- Keep workout revision history auditable while evaluating data health against the corrected current workout record. A bad historical entry can remain visible in revision history without being mistaken for the active workout.
- Add a Tools → Backups & data → Training data health panel with compact current-data status, RPE coverage and reviewable issue details.
- Add the same current-data integrity check to the v2.46 next-program handoff: invalid/extreme current strength-set entries block launch until reviewed, while corrected historical revision warnings remain non-blocking audit evidence.
- Harden JSON replacement imports by validating v25 meet cycles, adopted programs and frozen transition snapshots before current data is replaced. Invalid advanced-program records fail the import and leave the existing state intact.
- Include training-data health in the import review prompt so suspicious current entries are visible before replacement while still preserving the user's choice to import valid data.
- Add deterministic regression coverage using a real-world-style corrected 1016.95 kg bench typo, missing/invalid RPE, historical revision isolation and strict malformed-transition import rejection.
- Preserve schema v25 and all existing workout/program records; this release adds no automatic programming action, no new medical/recovery inference and no top-level migration.

# v2.46.0 — Next Program Handoff / Start Next Block

- Add a first-class next-program handoff that turns the completed-block evidence chain into one guided transition into the existing reviewed phase builder.
- Require a frozen v2.42 transition baseline before a handoff can become ready. The handoff uses v2.43 per-lift next-block objectives and current goal context instead of recomputing an undocumented starting point.
- Add explicit readiness checks for current programming profile, unique competition-lift mappings, resolved prior-program sessions, unfinished workout drafts, newer unscheduled reviewed programs, and overlapping Calendar sessions.
- Separate blockers from warnings. Pending/unconfirmed sessions, missing mappings, draft conflicts, competing reviewed programs, or Calendar overlap block the launcher; skipped/cancelled prior work and changed competition identities stay visible as warnings/evidence.
- Propose the next Monday start date and evidence-backed phase duration from the current next-block objective. The handoff does not create or schedule anything itself.
- Carry prior selected training maxes into the phase builder only as editable review references. Loadnote does not automatically increase them at the handoff.
- Prefill the existing phase builder with handoff-derived name, start date, accumulation/strength duration, training days, session duration, and prior training-max references.
- Keep exercise selection, exposure roles, frequency, set counts, weekly step, load increment, variations, training maxes, final prescription review, and Calendar scheduling athlete-controlled.
- Surface per-lift next objectives, prior-block response context, a proposed handoff window, and a clear “What Loadnote carries forward / what stays athlete-reviewed” explanation.
- Add a single **Review next program** action only when all blocking readiness checks pass.
- Detect the existing local workout draft so an unfinished gym session cannot be silently abandoned during program transition.
- Add deterministic and browser coverage for complete handoff readiness, prior-TM prefill, Monday start-date calculation, competition-role failures, pending prior sessions, Calendar conflicts, and unfinished draft blocking.
- No top-level schema migration.

# v2.45.0 — Learned-history guardrails for adaptive decisions

- Feed v2.44 adaptive outcome history into the meet-cycle adaptive controller as a guardrail on already-eligible actions.
- Preserve the live deterministic rules as the primary authority. Learned history cannot create an action, bypass evidence/phase/schedule eligibility, or increase the size of an adjustment.
- Use same-lift + same-action history only. Squat reductions do not influence bench progression, and load changes do not borrow evidence from set changes.
- Require at least three exact observed follow-ups before learned history can affect a recommendation. Smaller samples remain “collecting.”
- When repeated same-lift upward progressions have more declined than improved outcomes and a negative median capacity change, suppress the optional controller increase to **keep** while leaving the manually eligible increase visible for athlete review.
- Never use poor historical outcomes to block a current safety-oriented reduction that is supported by live above-cap/capacity evidence. Instead, downgrade confidence and surface the historical caution.
- Supportive repeated history can reinforce confidence/explanation but cannot generate progression when the current week does not independently qualify.
- Mixed/stable repeated history adds caution and can lower controller confidence without changing the underlying eligible action.
- Add `cycle-adaptive-v4` controller output with per-lift history state and rationale.
- Update the weekly-review UI so “Use controller choices” reflects the learned-history guardrail while preserving all manual choices allowed by the current live evidence.
- Keep phase-review eligibility independent to avoid a circular dependency between the phase decision engine and the outcome-learning layer.
- Add deterministic and browser coverage for suppressed upward progression, preserved safety reductions, supportive history, sparse-history no-op behavior, lift/action isolation, and manual eligibility retention.
- No top-level schema migration.

# v2.44.0 — Adaptive decision outcome learning

- Close the adaptive loop by evaluating what happened after athlete-approved phase and meet-cycle programming adjustments.
- Attribute a follow-up only when training is linked to the exact approved Calendar prescription, uses the same competition-exercise identity, has valid load/reps/RPE evidence, and has no intervening plan revision.
- Classify descriptive follow-up as improved, stable, declined or unobserved using competition-lift estimated-capacity change. These labels are observations, not causal claims.
- Learn separately by lift and action (for example bench increase-load vs squat reduce-load) instead of pooling unlike decisions.
- Require at least three exact observed follow-ups for the same lift + action before describing a repeated pattern; six or more becomes reviewable history. Sparse evidence remains explicitly “collecting.”
- Report improved/stable/declined counts plus median observed capacity change for each action pattern.
- Include approved phase actions (reduce load, reduce sets, add set, progress) and meet-cycle actions (reduce one set, reduce load, increase load). Keep decisions are not treated as intervention outcomes.
- Exclude follow-ups when plans were later revised, prescriptions deviated, RPE is unusable, exercise identity changed, or the next exposure is incomplete.
- Surface adaptive outcome learning inside the existing Decision Performance area with the existing per-lift filter instead of adding a competing dashboard.
- Preserve all existing workout, Calendar, phase-review, meet-cycle and goal history. Outcome learning is read-only and introduces no automatic programming changes.
- Add deterministic tests for phase and meet-cycle attribution, repeated-pattern thresholds and exclusion after later revisions, plus browser coverage for the Decision Performance learning view.
- No top-level schema migration.

# v2.43.0 — Transition evidence → next-block objectives

- Add deterministic per-lift next-block objectives that combine long-term goal distance with the latest frozen v2.42 transition baseline.
- Keep squat, bench and deadlift independent. A lift can continue productive progression while another consolidates or rebuilds tolerable loading.
- Use completed-session coverage as a guardrail: blocks with poor coverage or unresolved/pending sessions cannot justify aggressive response-based progression.
- Use frozen competition-lift capacity change and recent 28-day average RPE as descriptive response signals. Negative/very-high-effort blocks favor rebuilding tolerance; flat responses favor consolidation; clearly positive, manageable-effort blocks can continue progression.
- Ignore prior transition response when the competition-exercise identity changed; fall back to the current goal-distance objective instead of transferring evidence across lifts/exercises.
- Preserve linked phase-review decisions as context and expose how many mid-block adjustments were needed for each lift.
- Derive the whole-program phase shape from the most conservative unresolved lift. This can increase development emphasis, but never changes training maxes, exercise selection, frequency, sets or weekly adaptive rules automatically.
- Surface the per-lift objective, prior-block response and rationale directly in the phase builder.
- Freeze the complete objective snapshot into newly reviewed phase programs so future analysis can audit what Loadnote believed and why when the block was approved.
- Transition-derived phase guidance takes priority over the more general date-free goal-cycle default when a valid frozen handoff exists.
- Add deterministic and browser coverage for mixed lift responses, low coverage, exercise-identity changes, conservative whole-block shaping, objective persistence and unchanged reviewed prescription boundaries.
- No top-level schema migration.

# v2.42.0 — End-of-program transition baseline

- Add an immutable transition baseline for completed, scheduled phase programs so the next block can start from the evidence that actually existed at the handoff.
- Capture the original goal snapshot plus current goal context, per-lift competition exercise identity, selected training max, current supported capacity/1RM reference, change from the block-start reference, readiness status, and the prior 28 days of exact competition-lift sessions, sets, volume, RPE coverage and logged load.
- Capture full scheduled-session coverage for the completed program, including completed, skipped, cancelled and unconfirmed sessions plus resolved-session adherence. Incomplete data is preserved as evidence rather than hidden.
- Preserve phase-review history linked to the completed program so future analysis can distinguish the program itself from athlete-approved mid-block decisions.
- Require the reviewed program to be scheduled and to have reached its final scheduled date before the snapshot can be created.
- Save one baseline per program after explicit athlete review. Once saved, the record is read-only and does not rewrite workouts, goals, training maxes, program sessions or Calendar history.
- Surface the transition review inside the existing saved phase-program card. Before program completion, show the date when the handoff becomes available.
- Add schema v25 with a backward-compatible empty `transitionSnapshots` collection; no existing workout/program data is rewritten.
- Include transition snapshots in import-diff previews and release-readiness validation.
- Add deterministic and browser coverage for complete and incomplete session coverage, goal/training-max context, recent workload/RPE, immutable source history, duplicate protection and schema migration.

# v2.41.0 — Date-free strength-goal cycles and dynamic block horizons

- Add a date-free strength-goal cycle engine that chooses a conservative next phase shape from the current per-lift goal objectives without requiring a meet or PR date.
- Express goal horizon in **productive blocks**, not calendar dates. With fewer than two completed comparable goal-aware blocks, Loadnote explicitly withholds a horizon.
- Require repeated positive comparable block responses before estimating a range. Negative, missing, identity-changed, or non-comparable blocks do not become optimistic progress evidence.
- Recalculate the block range from the athlete's own completed goal-aware phase programs and current competition-lift capacity evidence; ranges are planning context, not promises.
- Use objective-aware phase shapes: development, strength-development, specific-strength, or consolidation. Only accumulation/strength duration is prefilled; training maxes, exercises, frequency, sets, and weekly adaptation rules remain separately reviewed.
- Keep the existing deload boundary and supported phase-duration limits.
- Surface goal-cycle guidance and per-lift horizon status directly in the phase builder. Date-free goals show that no target date is required.
- Preserve the v2.40 target/training-max separation. Goal distance never directly sets load.
- Add deterministic and browser coverage for phase-shape selection, horizon evidence thresholds, immutable source configuration, and date-free phase-builder defaults. No top-level schema migration.

# v2.40.0 — Goal → Programming bridge

- Connect active powerlifting squat, bench and deadlift targets to reviewed programming context without converting long-term goals into training maxes or direct load prescriptions.
- Add deterministic per-lift goal context: saved target, current comparison reference when supported, distance to target, readiness status, current/selected training-max context and a block-level objective.
- Support date-free strength goals explicitly. No calendar deadline is inferred from target distance alone; the goal horizon stays unestimated until later block-response evidence can justify a range.
- Use evidence-aware objectives such as establish baseline, long-range development, build strength, close the remaining strength gap, verify target-level strength and consolidate target-level strength.
- Prefer current RPE-aware competition-lift estimated capacity as the comparison reference, then fall back to a known 1RM or profile benchmark. Training maxes and ordinary working loads are not treated as proof of target achievement.
- Snapshot goal context into newly reviewed phase programs so later analysis can know what targets and evidence were present when the block was approved.
- If goal context changes before scheduling a newly goal-aware phase program, require a fresh program review instead of silently scheduling stale context. Legacy phase programs without a goal snapshot remain valid.
- Surface goal context directly in phase-program preview and saved-program review, including a clear statement that targets do not replace training maxes or weekly adaptation rules.
- Handle multiple active powerlifting goals conservatively by withholding goal-specific programming context until the goal set is disambiguated.
- Add unit and browser tests covering date-free goals, target/training-max separation, current-capacity comparison, immutable snapshots and browser review flow. No top-level schema migration.

# v2.39.0 — Guarded one-increment upward progression

- Add a fourth meet-cycle weekly review choice: **one program load increment higher** on the confirmed competition exercise for a lift. The change still applies only to the next week and requires explicit athlete approval.
- Keep the progression evidence stricter than reductions. The reviewed week must resolve cleanly; all planned competition-lift sets must be completed; at least four competition-exercise sets must be directly comparable to their pre-training prescription; none may exceed its RPE cap; and at least two must finish at least 0.5 RPE below cap.
- The adaptive controller only recommends the increase when the completed phase also shows an estimated-capacity comparison of at least **+1%**. Without that longer-term improving signal, the controller keeps the original load even when the manual review action is structurally available.
- Separate competition-exercise evidence from variation/light-family evidence so a strong variation cannot earn progression on the competition lift.
- Apply increases as exactly one reviewed program increment in internal kg, display that increment in the athlete's selected kg/lb unit, preserve reps and set counts, and leave variations unchanged.
- Refuse increases that would exceed the existing **85% training-max ceiling**, or when future sessions are missing, revised, rescheduled, started, logged or open in a draft.
- Preserve peak/peaking, taper, mock-meet and competition-meet guards. No exercise swaps, frequency changes, phase changes, event changes or completed-history edits are introduced.
- Preserve legacy `cycle-week-set-v1` and v2.38 `cycle-week-adjust-v2` review records; new reviews use `cycle-week-adjust-v3`.
- Add deterministic and browser coverage for competition-only evidence, one-increment kg integrity, lb display, immutable original cycles and unchanged reps/set counts. No top-level schema migration.

# v2.38.0 — Bounded load adaptation in meet-cycle Decisions

- Expand the cycle adaptive controller from **keep / one fewer set** to **keep / one fewer set / one program load increment lower** for the next week only, independently for squat, bench and deadlift.
- Require stronger evidence before the controller recommends a load reduction: at least two directly comparable above-cap RPE sets, at least three comparable sets total, and a within-phase estimated-capacity comparison at or below -3%. High effort without that added signal remains eligible only for the existing bounded set reduction when otherwise supported.
- Apply load reductions as exactly one reviewed program increment in internal kg to matching next-week sets. Reps, set count, exercise identity, exposure frequency, phase dates and the immutable original cycle remain unchanged.
- Preserve peak, taper, mock-meet and competition-meet guards. Previously revised, started, logged, rescheduled or draft-locked future sessions remain ineligible.
- Keep athlete approval mandatory. The controller never increases load, changes reps, swaps exercises, changes frequency or edits completed history automatically.
- Preserve legacy v2.32–v2.37 `cycle-week-set-v1` review records while new reviews use `cycle-week-adjust-v2`.
- Add deterministic and browser coverage for load reductions, kg increment integrity, old review compatibility and immutable history. No top-level schema migration.

# v2.37.0 — Adopt user-authored programs into Decisions

- Add an explicit **Adopt an existing program** workflow for programs already saved in the legacy Program Library. Preserve the original user-authored program snapshot instead of pretending Loadnote generated it.
- Convert parseable set × rep entries into a reviewed, dated 1–52 week execution baseline with athlete-selected weekdays. Exercise identity is reused from the catalog when available.
- Distinguish authored versus filled context: explicit `@ RPE` remains user-authored; otherwise the athlete approves a default adoption-time RPE cap. Optional recent logged loads are labeled as Loadnote-filled execution targets rather than part of the original program.
- Allow prescriptions to intentionally omit an exact load. This avoids encoding unknown loads as 0 kg and lets planned-versus-completed comparisons use reps/RPE without inventing weight.
- Schedule adopted programs only after explicit review and Calendar conflict checks. Preserve the frozen source snapshot and store adoption records in schema v24.
- Add deterministic adopted-program weekly reviews. Keep remains the default; after a resolved week, an exercise may offer one fewer set on matching next-week exposures only when at least two directly comparable sets exceeded the approved RPE cap and future work is still untouched.
- Do not automatically increase load, substitute exercises, change frequency, rewrite completed workouts or infer that high RPE is a medical/recovery measurement.

# v2.36.0 — Cycle-level adaptive programming controller

- Add a deterministic per-lift controller for scheduled meet-prep cycles. It combines the existing completed-week prescribed-versus-performed review with within-phase response context and recommends only actions the current bounded review engine can safely execute.
- Recommend **keep** or an athlete-reviewable **one-set reduction** independently for squat, bench and deadlift. Two or more directly comparable above-cap RPE sets are required before volume reduction is suggested; sparse or ambiguous evidence keeps the original plan.
- Respect phase guards: peak, taper and mock/competition event weeks are not rewritten by this controller. Estimated-capacity trends may reinforce context but never diagnose fatigue or establish causation.
- Surface controller reasoning and confidence inside the existing weekly review. Keep remains the UI default; **Use controller choices** only fills the review selections, and the athlete must still explicitly approve before any future Calendar revision is written.
- No schema migration and no automatic load increases, exercise substitutions, meet-attempt selection or history edits. Add focused controller tests and include the module in the offline app shell.

# v2.35.0 — Distinguish mock meets from competition meets

- Add an explicit meet-event type to flexible meet-prep cycles: **Mock meet** or **Competition meet**. Existing cycles without the field remain mock meets for backward compatibility.
- Competition cycles require a meet name, may use any date inside the final program week, and end in a distinct `meet` phase. Mock meets retain their Saturday/Sunday final-week rule and `mock-meet` phase.
- Keep results separate by event type: mock-meet attempts remain in the existing mock-meet revision history; competition-meet attempts use a distinct competition result history. Both retain corrections and nine athlete-entered attempt slots without automatic attempt selection.
- Update Decisions, cycle cards, result logging and post-cycle language so competition meets are not presented as mock meets. Competition results are explicitly athlete-entered and not verified federation records, placings or weigh-in data.
- Preserve existing training cycles, approved workouts, result history and state schema. Add deterministic and browser regressions for real-vs-mock event behavior.

# v2.34.0 — Actual mock-meet attempts and post-cycle recap

- Record up to three athlete-entered squat, bench and deadlift attempts as made, missed, passed or unrecorded on or after the scheduled meet date, with an explicit review confirmation. Store kg internally and convert only numeric display/entry using the existing unit utilities.
- Keep time-stamped, immutable corrections as revisions on the existing meet-cycle record. The best made attempt is reported per lift; display a three-lift total only when all three lifts have at least one made attempt. No automatic attempt selection or inferred competition results.
- Show a read-only post-cycle comparison of completed training weeks and linked sessions, original versus actual working sets, and sparse, RPE-aware within-phase estimated-capacity context. These estimates are not meet-day results or proofs of program causation.
- Preserve all existing original cycles, workouts, prescriptions, weekly reviews, imports, legacy meetCycles and offline behavior; add mock-meet record validation, mobile/browser and deterministic tests, and cache new assets. No top-level schema migration.

# v2.33.0 — Individual competition-lift response across completed phases

- Add a read-only, dated mock-meet-cycle training-response view for completed weeks grouped by phase, with independent squat, bench and deadlift exposure and set counts, linked logged work, directly comparable RPE-cap exceedances, and transparent unconfirmed/skipped/changed Calendar records.
- Compare within-phase RPE-aware estimated competition-lift capacity only when four eligible distinct days span at least 14 days. Use the existing capacity-evidence utility, explicit competition exercise identity, validated pre-training schedule links and first-two versus last-two median comparison. Never substitute variations, future imports, or unverified sessions; never imply causal adaptation.
- Keep unfinished phases and sparse logs clearly labeled. No prescriptions, athlete choices, workout history or state schemas are changed. Add deterministic tests, mobile browser coverage and offline assets.

# v2.32.0 — Reviewed meet-cycle weeks and phase transitions

- Add a read-only, as-known weekly review for any completed week in a scheduled 7–52-week mock-meet cycle. Summarize original per-lift sets and exposures, linked actual work, comparable RPE cap exceedances, unconfirmed sessions and explicit skips.
- Identify phase-transition weeks and explain upcoming phase priorities without rewriting phase boundaries. Athlete approval can preserve the plan unchanged or remove exactly one working set from each eligible exposure of an independently selected lift in the next week only.
- The bounded reduction requires two directly comparable above-cap RPE sets, resolved prior-week sessions and untouched future Calendar prescriptions with at least three sets per affected exposure. Peak/taper/mock-meet targets, completed workouts, open drafts and previously revised sessions cannot be changed by this rule.
- Store an auditable review alongside the original cycle with before/after Calendar revisions and policy metadata. Keep the original cycle and completed history intact; no new top-level schema or automatic progression.
- Add mobile browser and deterministic review/evidence/approval tests, version metadata and offline assets.

# v2.31.0 — Phase-aware Decisions for flexible meet cycles

- Add deterministic, read-only Decisions context for the active, upcoming or completed scheduled meet cycle. Show current week and phase, phase-week count, mock-meet date, upcoming programmed training, current-week review and phase-transition date.
- Present different, bounded programming priorities during accumulation, strength, peaking, taper and mock-meet week. Summarize original per-lift planned sets/exposures alongside separately linked actual valid sets, comparable logged RPE and cap exceedances.
- Distinguish explicitly skipped, cancelled, upcoming, unconfirmed and untrustworthy schedule links; preserve as-recorded knowledge cutoffs and warn when sessions were revised, logs are timestamp-ambiguous or sets changed. Missing logs are never labeled skipped and outcomes are never described as proof of recovery or program effectiveness.
- Keep the original meet cycle, revisions and workout history unchanged. No automatic future adjustments, meet-attempt prescription or new storage schema; phase-specific approval workflow remains the next milestone.
- Add Node and mobile/browser regression coverage, release metadata and offline cache assets.

# v2.30.0 — Configurable mock-meet training cycles

- Build reviewed mock-meet cycles from existing reviewed, competition-lift-specific phase setup. Choose 7–52 weeks (presets for 8/12/16/20), 1–4 peak weeks and 1–2 taper weeks; the final week marks a Saturday/Sunday mock meet. Automatically allocate remaining weeks to accumulation and strength (minimum two each).
- Generate and preview every training week and working set using the existing phase-builder’s validated lift identities, exposure days, training maxes and capped strength-loading templates. Supported phase progressions stop after six weeks rather than extrapolating indefinite increases; peak/taper use limited competition-lift examples rather than unsupported maximal attempts.
- Save immutable original cycle records and source profile/role snapshots; schedule approved training as distinct, revisioned Calendar sessions only after explicit confirmation and conflict checks. Mock-meet day is a dated marker, not an invented attempt prescription.
- Add active-cycle week/phase context to Decisions, a mobile program-builder entry point, schema-v23 meetCycles migration, import/export compatibility and tests for 8/12/16/20/26/52-week plans, kg-backed loads, conflicts and historical integrity.
- Subsequent releases will introduce phase-aware guidance and explicit per-phase adjustments for these longer cycles; this release does not automatically alter the approved plan.

# v2.29.0 — Decisions mobile UX overhaul

- Reorder Decisions around the current training plan, compact per-lift decisions, programming reviews/builders and adjustment outcomes; preserve the existing model, actions, record identities and manual approval flow.
- Replace duplicated unavailable-evidence summaries and blank-looking status pills with compact lift cards, meaningful status text and expandable details. Add an optional per-lift evidence-help panel linking directly to the workout logger.
- Fix wrapped accordion heading/description layout, narrower mobile spacing and dark-mode status contrast. Remove the outdated v2.7 feature label and numbered secondary tabs; keep the active tab and all existing tools.
- Add desktop/mobile browser regressions. No user data migration or programming-rule change.

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
