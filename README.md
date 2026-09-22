# Loadnote

**v2.6.3 · Development build.** A local-first strength-training log evolving into an explainable training-decision system for strength athletes.

## v2.6.3 — Context-aware feedback

Decision performance includes expandable context-matched observations and a read-only rule comparison. New feedback captures block context; older events stay unknown. Counts and exclusion reasons remain visible, with means withheld below three unique follow-ups per response/context. This is not causal evidence, automatic personalization or a policy change. See [definitions and limitations](docs/context-feedback.md).

## v2.6.2 — Focused training experience

- Home starts with the workout action, an optional plan preview and a concise 30-day training summary; session/status detail remains expandable.
- Device connection and export controls are collapsed behind a compact Device & backup control; the backup reminder remains visible but expands for its explanation and actions.
- Decision Center shows Squat, Bench and Deadlift recommendations first; historical review, readiness, mapping and outcome reports are grouped under Decision settings & evidence.
- Each withheld decision displays the actual recorded evidence blocker and next step; the engine's evidence requirements and historical attribution remain unchanged.
- Training safety remains available on the Decisions screen. No data migration or coaching policy change.

## v2.6.0 — Block-aware decisions (Part 1)

Decisions now explains the **recorded training-block phase** beside each compact squat/bench/deadlift card. It uses explicit block type and progression intent, not a guess from the block name, goal text or a single heavy set. A General block with Testing intent is interpreted as Testing, with its provenance displayed. Return, Accumulation, Strength, Peaking, Testing and Deload have phase-aware plan-preserving guidance.

A testing/deload/peaking block prevents an unplanned Increase suggestion from overriding the saved plan. Contradictory explicit phases withhold direction for review. Missing training maxes, known 1RMs and incomplete history are displayed as limitations, never silently inferred or backfilled. The existing competition-lift exercise mapping and RPE-aware evidence remain the basis of trends, and submaximal singles are not relabeled tested 1RMs.

This is **Part 1 only**: no personalization from feedback, automatic threshold tuning, editing recorded blocks, program changes or data migration.

## v2.5.5 — Update visibility patch

An installed Loadnote page now checks for updated app assets when opened and when returning to the foreground (at most once per minute). A newer version shows a save-before-update banner; an active workout is not silently reloaded. The visible footer, release metadata, package version and offline cache are synchronized.

## v2.5.4 — Simpler first view

- The five main navigation destinations are Home, Train, Progress, Decisions and More; desktop and mobile secondary destinations are grouped by task.
- Home starts with the training command, plan and weekly rhythm; quick-start links, six metrics and detailed reports remain under **More from your training**.
- Decisions starts with three compact lift recommendations. Expand a lift for next-exposure guidance, the optional athlete response, and audit evidence; historical date/replay controls and legacy programming setup stay under labeled dropdowns.
- Navigation and form state remain local. No logged workouts, programs, decision logic or storage schema are changed.

## v2.5.1–v2.5.3 Feedback analysis completion

v2.5.1 distinguishes how many directional overrides were **recorded** versus how many have a unique observed next exposure. The report exposes separate denominators, outcomes and still-pending/overlapping cases; it does not infer that the athlete followed the intended direction.

v2.5.2 gives lift-filtered decision/evidence trails with exact workout-ID navigation into Train history, rather than stopping at a shared workout date. The linked card is highlighted when the workout still exists.

v2.5.3 separates missing baseline evidence from pending or beyond-window outcomes; shows both all-feedback outcome coverage and comparable coverage; excludes future-dated activity and feedback saved or edited on/after the outcome workout from independent prospective outcome counts. Descriptive coverage labels are not statistical confidence scores.

This is one cumulative v2.5.3 code release. No storage migration, automatic threshold update or change to prescribed training.

## v2.5 Decision performance and outcome attribution

Decisions now includes an expandable, lift-filtered **Decision performance** report: Accept / Modify / Ignore rates; uniquely observed next exposures; pending, expired and overlapping feedback; capacity/RPE summaries by response; and direction-override patterns with auditable workout evidence.

Attribution rule: a squat/bench/deadlift workout contributes only one outcome for that lift. If multiple saved decisions lead to that same next usable exposure, the latest preceding decision receives the attributed outcome; earlier events remain visible but are marked overlapping and excluded from independent outcome statistics. This does not prove a choice caused a performance change. At under three unique follow-ups the view says Collecting feedback; three to nine says Early pattern; ten or more says Reviewable history. These are coverage descriptions, not confidence scores.

The release is read-only analytics. No automatic learning, rewritten training logs, exact load advice or stored-state migration.

## v2.4 Athlete decision feedback

v2.4 adds a local feedback loop to live Decision Center recommendations. For today's current-corrected squat, bench and deadlift decisions, the athlete can **Accept**, **Modify**, or **Ignore** the recommendation.

Modify records the athlete's chosen direction (Increase, Hold, or Reduce) plus an optional reason. Each response preserves the decision snapshot that was shown at the time, including the engine version, rationale, next-exposure guidance and supporting evidence.

Decision history automatically links a saved response to the next usable exposure for the same saved competition-lift exercise identity. Historical replay remains read-only so hindsight cannot be recorded as live athlete feedback.

This release only records and displays feedback. It does not automatically personalize thresholds, alter programs, select exact loads, or assign confidence scores.

## v2.3 Decision backtesting

v2.3 adds walk-forward historical validation for the Decision Engine. Historical decisions are replayed at explicit cutoff dates using only information available at that point, then compared with the next usable competition-lift exposure.

The report measures observed outcomes rather than treating historical programming choices as a correct-answer label. It includes abstention rate, outcome coverage, next-exposure capacity response, Increase/Reduce follow-up behavior, warning misses, and side-by-side threshold sensitivity.

Decision thresholds are now explicit and testable, but v2.3 still does not automatically optimize them, assign a confidence percentage, or choose exact kilograms.

## v2.2 Decision workflow

The Decision Center now answers three questions for each competition lift: **What is the decision? What should the next exposure do? What should I watch next?** The engine returns deterministic next-exposure and watch-next guidance alongside Increase, Hold, Reduce or Insufficient evidence.

Exact kilograms remain outside the decision engine. Loadnote still separates demonstrated capacity from programming prescription and does not automatically change workouts, schedules, training maxes or programs.

## v2.1.4 iOS date inputs

iOS Safari date controls now have their native intrinsic width explicitly reset so date fields stay inside narrow cards and two-column mobile forms. The fix preserves the date picker while preventing the browser's built-in control width from overflowing its container.

## v2.1.3 Responsive form controls

Form controls now follow a shared responsive layout contract so inputs, selects and textareas cannot force cards or panels wider than the viewport. Flex and grid form children are allowed to shrink correctly, while compact workout-set controls keep their intended sizing.

A mobile browser regression now checks visible form controls across the main app destinations for card and viewport overflow.

## v2.1.2 More and disclosure polish

The mobile More sheet now uses the same card-based visual language as the primary app, with clearer labels and short descriptions for Food, Calendar, Measurements, Photos, Tools and Gym mode.

The Decisions/Coach disclaimer and in-app privacy summary have been updated to reflect the current local-first decision-support architecture, optional external AI requests, and the read-only nature and limitations of training recommendations.

## v2.1.1 Progress and Decisions hierarchy

Progress now opens with a compact overview of recent training, saved records, and body-progress destinations before deeper evidence. Training Review remains available but collapsed by default.

Decisions now uses an answer-first hierarchy: the squat, bench and deadlift decision cards appear before readiness diagnostics. Evidence readiness, role mapping and the evidence contract remain available as expandable audit layers.

## v2.1 Simplified navigation

v2.1 reorganizes the app around the athlete's main jobs instead of exposing every feature equally. Mobile navigation is now **Home · Train · Progress · Decisions · More**. Nutrition and other lower-frequency tools remain available under More rather than occupying permanent primary navigation.

**Progress** now contains Training Review and personal records, keeping deeper analysis out of the daily Home experience. **Decisions** opens directly to the Decision Center, with Next Decision and Decision Readiness first; legacy coaching insights, chat, goals, athlete profile and program tools remain available without being removed.

The information architecture follows progressive disclosure: show the answer first, explanation second and detailed evidence only when expanded. No stored training data or schema changes are required.

## v2.0 Training Decision Engine

v2.0 introduces the first read-only **Training Decision Engine** for the competition squat, bench press and deadlift. It evaluates existing Decision Readiness evidence and returns one of four directional outcomes: **Increase**, **Hold**, **Reduce**, or **Insufficient evidence**. Each decision keeps demonstrated capacity separate from training prescription, explains the evidence behind the outcome, respects conservative return/re-entry context and requires an explicit analysis date so future workouts cannot leak into earlier decisions.

Submaximal singles remain observed load/RPE evidence rather than inferred capacity. The engine does not automatically change workouts, schedules, programs or training maxes, and it does not publish a numeric confidence score before walk-forward backtesting can support one. See [the decision-engine contract](docs/decision-engine.md).

## v2.0 UX

The v2.0 UX pass focuses on progressive disclosure: show the useful answer first and keep deeper evidence available without letting analytics dominate the main interface. **Training Review now collapses by default** and can be expanded when the athlete wants the full review. Athletes can also choose which strength exercises to display, including one or more selected lifts instead of rendering every exercise in the review range.

These controls are presentation-only. They do not change workout history, calculations or stored data. The existing analysis date, review range, training-block context, evidence mode, trends, supporting sessions and workout-edit links remain available inside the expanded review.

Coach → Programs now also loads the read-only **Next Decision** view in the browser. It shows Increase, Hold, Reduce, or Insufficient evidence for squat, bench and deadlift using the same analysis date and replay mode as Decision Readiness, with the reason and supporting signals visible on demand.

## v1.17 History cleanup & coverage

Workout History now offers a review-only cleanup panel: unusual middle-set loads, possible exercise aliases with side-by-side history, and athlete-confirmed block coverage. Training Review links to the existing workout editor and shows submaximal singles as load/RPE observations, without new capacity estimates. No corrections or identity merges happen automatically. See [cleanup rules](docs/history-cleanup.md).

## v1.16 Evidence clarity

Training Review can now select a specific training block. Low-RPE work, missing RPE and submaximal singles have distinct explanations. Review, block analysis and Decision Readiness share a stricter capacity-evidence rule: multi-rep sets at RPE 6–10 or observed singles at RPE 10. Legacy PR/estimated-1RM calculations and saved records are unchanged. Displayed capacity trends may change because submaximal singles no longer masquerade as RPE-adjusted estimates.

## Training Review

v1.15 adds a compact **Training Review** below Strength Progress: dated weekly outcomes, separate prescribed-load/logged-load/capacity trends, block interpretation and expandable supporting sessions. Switch between corrected history and as-recorded replay. Missing evidence stays unknown; reviews never apply training changes. See [review definitions and replay limits](docs/training-review.md).

## Training Prescription & Session Intent

v1.14 adds **This week** on Home and **Scheduled sessions** in Calendar. Schedule a captured template/program/logger plan, start its linked draft, and explicitly reschedule, skip or cancel. Overdue sessions without a workout stay unconfirmed. See [scheduling and adherence definitions](docs/scheduling.md).

The workout logger can record a session role, goal and an immutable snapshot of planned sets separately from completed performance. Templates, repeated workouts and generated program days capture their loaded work automatically; a manual session can use **Use entered work as plan** before training. If execution changes, record the reason without rewriting the original plan.

History, block analysis and Decision Readiness now report planned-session coverage and planned-set completion. Missing planned work remains unknown rather than being treated as nonadherence. Loadnote still does not make or apply training decisions. See [the prescription contract](docs/session-intent.md).

## Athlete Model & Decision Readiness

Coach → Programs now includes a per-lift Decision Readiness panel. Confirm competition lifts and variation relationships, inspect an explicit analysis date, and compare logged load, RPE-aware estimated capacity, block training maxes, known 1RMs and legacy profile benchmarks without collapsing them into one “max.” Current-corrected analysis supports historical context entered later; Historical as-recorded replay withholds block and role knowledge that was not yet recorded and flags legacy timestamp limits.

v1.13 reports evidence quality and execution context only. It does not automatically change loads, prescribe deloads or enable the v2 decision engine. See [the evidence contract](docs/decision-readiness.md).

## Training Data Integrity

Schema 12 assigns stable identities to exercises without rewriting the labels in saved workouts. Compact spelling variants are linked automatically; Tools → Exercise identities & aliases can merge semantic aliases such as “Adduction Machine” and “Hip Adduction.” Analysis and previous-session lookup follow the stable identity.

Workout edits and deletions retain bounded revision snapshots with History-level undo. Duplicate creates a new draft instead of editing the source session. Imports show added/changed/removed record counts and save a local recovery snapshot before replacement; exported backups omit nested recovery payloads to stay portable.

## Training Block Context

Under Workouts, open Training Block Context to add a current or historical date range. Block dates are inclusive; open-ended blocks must end before a later block begins. Optional training maxes are programming choices, while known 1RMs are athlete-reported benchmarks. Both store kg and a known-on date. Neither becomes a capacity estimate.

Block analysis is explicitly retrospective and filters workouts through the analysis date. Three distinct performance days with usable reps and RPE are required for estimated-capacity trends. Prescription coverage and planned-set completion appear only where planned-session evidence exists. See [block API and backtesting](docs/training-blocks.md).

## Current features

- Log strength, timed holds and cardio. Review before saving; edit with revision-backed undo or duplicate a session into a new draft.
- Restore unfinished drafts, reorder exercises, use Focus mode and run a rest timer with pause/resume and refresh recovery. Review and timer controls stay in the page.
- Browse paginated history, filter dates, compare workouts and chart exercise progress. Strength charts include optional RPE in estimated 1RM, matching the training dashboard.
- Track food portions, edit entries, review barcode refreshes and mark complete nutrition days.
- View weekly activity, measurements, records, photos and training recommendations. Fatigue scoring waits for sufficient history; plateau signals require multiple sessions.
- Use coach insights, chat and suggested questions with light/night-mode styling.

## Run locally

Use Node.js 22. Run `npm run serve` and open `http://127.0.0.1:8000`.
The static app and Node checks do not require dependency installation.
Styles and charts ship with the app. After the first online load completes offline setup, workouts, history, timers and charts can be used offline. Online coaching and food lookup still require internet.

## Checks

- `npm test` — Node unit and integration tests.
- `npm run check` — production, script and test JavaScript syntax.
- `npm install --ignore-scripts`, then `npx playwright install chromium` — browser-test dependencies.
- `npm run test:browser` — desktop and mobile-viewport Chromium regressions.

Most behavioral tests stub charts and disable service workers. The offline suite uses real bundled assets and enabled service workers. They cover behavior and selected layout/contrast checks, not full production rendering, offline behavior or iOS Safari. See [testing](docs/testing.md).

## Repository and releases

Develop changes on a branch and open a pull request. The read-only GitHub Actions test workflow runs on pushes and PRs; it does not deploy. Review checks before merging. GitHub Pages serves the static app; the optional coach backend requires separate hosting.

`package.json` is the release-version reference. Update the release helper, app footer, service-worker cache, README and newest changelog entry together. Tests reject disagreement. Keep historical changelog entries and archived documents at their original versions. A branch name does not define the app version.

Use `npm ci` for locked installs and `npm run build:assets` to regenerate committed styles and charts. Updates wait for Save and update; drafts and data must save first. Close other Loadnote tabs before applying an update.

## Project map

| Location | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `energy.css` | App shell and shared visual system |
| `app.js` | Startup and remaining dashboard, coaching, program and feature orchestration |
| `src/product/` | Workout, nutrition, navigation, history/progress, drafts, timers and persistence |
| `src/core/`, `src/training/`, `src/coach/` | Shared data rules, training models and coaching |
| `tests/`, `tests/browser/` | Node and desktop/mobile Chromium regressions |
| `docs/` | Current architecture and testing guidance |
| `docs/archive/`, `dev-archive/` | Historical documentation and source |
| `backend/` | Optional coach server; not supplied by static hosting |

Native packaging remains experimental; see `docs/archive/README-NATIVE.md`.

## Data and development status

Workouts and drafts remain on the current browser/device. GitHub stores app code, not training-data backups. Export JSON before replacement imports or upgrade testing. Schema 15 preserves optional intent, planned-work and revisioned schedule records. v2.0 adds a read-only decision layer and UX improvements without changing the stored schema or rewriting older workouts.

See [CHANGELOG.md](CHANGELOG.md) and [architecture](docs/architecture.md). Automated checks are not a public-release sign-off or a comprehensive security audit.
