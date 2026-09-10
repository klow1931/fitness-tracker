# Current architecture

Loadnote is a static app using ordered browser scripts and shared global APIs. It is an incremental modularization of `app.js`, not a framework or ES-module rewrite. See `package.json` for the current release version.

## Module ownership

Paths below are under `src/product/` unless otherwise noted.

| Files | Responsibility |
| --- | --- |
| `state-store.js`, `persistence.js` | State defaults, normalization, IndexedDB/localStorage loading and serialized snapshot writes |
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

- Review freezes a form snapshot and rechecks it before confirmation. Create/edit/delete operations persist successfully before replacing visible history. Edits preserve record IDs and program metadata.
- Derived workout PRs are reconciled when sessions change; independent manual and legacy benchmarks are preserved.
- History uses pages of naturally sized cards, not fixed-height virtualization.
- Progress series separate reps, timed holds and cardio. Rep-based estimates use the core estimator with optional RPE; actual load remains a separate metric.
- Fatigue scoring requires 28 days of history and three distinct recent training days. Plateau labels use the analytics minimum-session guard. These are product heuristics, not clinical diagnoses.
- Draft migration preserves named fields, units, completion, order and edit context. Workout schema remains version 10.
- Persistence serializes snapshots. IndexedDB resolves on transaction completion. Marked localStorage fallback remains preferred after reload to avoid reviving stale IndexedDB data.
- Storage is browser-local. Simultaneous tabs and cross-device sync are not coordinated.

## Remaining boundaries

Continue extracting legacy orchestration only with regression coverage. Some non-workout inline handlers remain. Retired technique-review code is archived, while saved form-review records remain intact. Replace CDN styling with a local build before claiming full offline support.

The service worker caches the app shell; cache identity changes with releases. This does not change stored workout data. Release labels are checked against `package.json`.
