# Current architecture

Loadnote is a static app using ordered browser scripts and shared global APIs. It is an incremental modularization of `app.js`, not a framework or ES-module rewrite. See `package.json` for the current release version.

## Module ownership

Paths below are under `src/product/` unless otherwise noted.

| Files | Responsibility |
| --- | --- |
| `state-store.js`, `persistence.js` | State defaults, normalization, IndexedDB/localStorage loading and serialized snapshot writes |
| `data-integrity.js`, `data-integrity-ui.js` | Stable exercise identity, aliases, workout revisions, recovery snapshots and import previews |
| `decision-readiness.js`, `decision-readiness-ui.js` | Revisioned exercise roles, explicit-date evidence snapshots, point-in-time replay and per-lift readiness UI |
| `data-transfer.js` | JSON/CSV and photo-backup import/export |
| `draft-model.js`, `workout-logger.js` | Named-field draft validation, migration, capture, restoration and status |
| `workout-form.js`, `workout-templates.js` | Exercise/set forms, last weights, repeat and template flows |
| `workout-events.js` | Scoped, idempotent workout/review event delegation |
| `workout-session.js`, `session-ui.js` | Immutable create/edit operations, PR reconciliation, review and durable save coordination |
| `workout-history.js` | Paginated history cards, date/search filters and history actions |
| `progress-model.js`, `progress-ui.js` | Exercise series, tracking-mode-aware comparisons and exercise-detail dialogs |
| `training-flow.js`, `rest-timer.js` | Focus/completion, exercise order and deadline-based timer recovery |
| `nutrition-model.js`, `nutrition-ui.js`, `nutrition-forms.js` | Nutrient/portion rules, day summaries, food entry/edit and barcode review |
| `navigation.js`, `home-activity.js` | View navigation/refresh and weekly activity model |
| `units.js` | Display-unit conversion |
| `src/core/`, `src/training/`, `src/coach/` | Core schema, training analytics/progression and coaching rules |

`app.js` still coordinates startup and several dashboard, program, coaching and More-page views. Production script order and global compatibility boundaries are tested. `styles.css` and `energy.css` share layout/theme responsibility.

## Data and calculation boundaries

- Review freezes a form snapshot and rechecks it before confirmation. Create/edit/delete operations persist successfully before replacing visible history. Edits preserve record IDs and program metadata; edits and deletions append bounded revision snapshots for safe undo.
- Exercise labels remain historical display data. Schema 12 adds stable exercise IDs across workouts, templates, records and block benchmarks; compact spelling variants resolve automatically and explicit aliases can share an identity.
- Schema 13 adds athlete-confirmed exercise roles without rewriting workout labels. The evidence model keeps working load, estimated capacity, training max, known 1RM and legacy profile benchmarks separate.
- Newly saved workouts include save timestamps and creation revisions. Historical as-recorded snapshots reverse later workout revisions; legacy records without save timestamps remain usable but are flagged as incomplete replay evidence.
- Replacement imports expose collection-level added/changed/removed counts and include the prior state as one of three local recovery snapshots. Portable JSON exports omit nested recovery payloads.
- Derived workout PRs are reconciled when sessions change; independent manual and legacy benchmarks are preserved.
- History uses pages of naturally sized cards, not fixed-height virtualization.
- Progress series separate reps, timed holds and cardio. Rep-based estimates use the core estimator with optional RPE; actual load remains a separate metric.
- Fatigue scoring requires 28 days of history and three distinct recent training days. Plateau labels use the analytics minimum-session guard. These are product heuristics, not clinical diagnoses.
- Draft migration preserves named fields, units, completion, order and edit context. Schema 12 wraps integrity metadata around the existing workout payload shape.
- Persistence serializes snapshots. IndexedDB resolves on transaction completion. Marked localStorage fallback remains preferred after reload to avoid reviving stale IndexedDB data.
- Storage is browser-local. Simultaneous tabs and cross-device sync are not coordinated.
- Decision-readiness results are evidence-quality classifications, not training prescriptions. The v2 decision engine remains disabled.

## Remaining boundaries

Continue extracting legacy orchestration only with regression coverage. Some non-workout inline handlers remain. Retired technique-review code is archived, while saved form-review records remain intact. Styles and charts are now generated into committed assets; food lookup and online coaching still require a connection.

The service worker caches each release's complete app shell without background replacement. app-lifecycle.js presents waiting updates, saves drafts/data before explicit activation and blocks activation while other app tabs are open. Old caches are retained for open pages; cache reclamation remains follow-up work. Browser eviction can still remove local caches/data, so exports remain important. Release labels are checked against `package.json`.
