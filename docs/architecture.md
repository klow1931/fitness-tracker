# Current architecture

Loadnote is a static app using ordered browser scripts and shared global APIs. It is an incremental modularization of `app.js`, not a framework or ES-module rewrite. See `package.json` for the current release version.

## Module ownership

Paths below are under `src/product/` unless otherwise noted.

| Files | Responsibility |
| --- | --- |
| `state-store.js`, `persistence.js` | State defaults, normalization, IndexedDB/localStorage loading, serialized snapshot writes and device-only records such as the acknowledged sync base |
| `sync-model.js`, `remote-sync.js`, `sync-coordinator.js`, `account-session.js`, `account-ui.js` | Deterministic account-data merge rules, authenticated remote transport, manual sync orchestration, session boundary and consumer account/sync UI |
| `data-integrity.js`, `data-integrity-ui.js` | Stable exercise identity, aliases, workout revisions, recovery snapshots and import previews |
| `decision-readiness.js`, `decision-readiness-ui.js` | Revisioned exercise roles, explicit-date evidence snapshots, point-in-time replay and per-lift readiness UI |
| `session-intent.js`, `session-intent-ui.js` | Planned-work validation/comparison, session roles, deviation context and logger presentation |
| `data-transfer.js` | JSON/CSV and photo-backup import/export |
| `draft-model.js`, `workout-logger.js` | Named-field draft validation, migration, capture, restoration and status |
| `workout-form.js`, `workout-templates.js` | Exercise/set forms, last weights, repeat and template flows |
| `gym-floor.js`, `gym-floor-ui.js`, `logger-quick-entry.js`, `logger-quick-entry-ui.js` | Between-set mobile input semantics, previous-set reuse, current-set progression and one-handed workout controls |
| `workout-events.js` | Scoped, idempotent workout/review event delegation |
| `workout-session.js`, `session-ui.js` | Immutable create/edit operations, PR reconciliation, review and durable save coordination |
| `workout-history.js` | Paginated history cards, date/search filters and history actions |
| `progress-model.js`, `progress-ui.js` | Exercise series, tracking-mode-aware comparisons and exercise-detail dialogs |
| `training-flow.js`, `rest-timer.js` | Focus/completion, exercise order and deadline-based timer recovery |
| `nutrition-model.js`, `nutrition-ui.js`, `nutrition-forms.js` | Nutrient/portion rules, day summaries, food entry/edit and barcode review |
| `navigation.js`, `profile-ui.js`, `home-activity.js` | Primary/secondary navigation, consumer Profile composition and weekly activity model |
| `program-lifecycle.js`, `program-lifecycle-ui.js` | Deterministic active-program state and workflow routing across training, reviews, events, transition baselines and next-block handoff |
| `units.js` | Display-unit conversion |
| `src/core/`, `src/training/`, `src/coach/` | Core schema, training analytics/progression and deterministic/structured coaching rules |
| `coach-client.js`, `backend/coach-gateway.js`, `backend/server.js` | Consumer online-Coach transport, bounded context/request contract, trusted server prompt, provider secret/configuration and response validation |

The v2.64 starting-prescription layer is read-only until explicit athlete application and stores only an additive audit snapshot on newly reviewed phase programs; it does not infer training maxes or change active-program adaptation rules.

`app.js` still coordinates startup and several dashboard, program, coaching and More-page views. Production script order and global compatibility boundaries are tested. `styles.css` and `energy.css` share layout/theme responsibility.

## Data and calculation boundaries

- Review freezes a form snapshot and rechecks it before confirmation. Create/edit/delete operations persist successfully before replacing visible history. Edits preserve record IDs and program metadata; edits and deletions append bounded revision snapshots for safe undo.
- Exercise labels remain historical display data. Schema 12 adds stable exercise IDs across workouts, templates, records and block benchmarks; compact spelling variants resolve automatically and explicit aliases can share an identity.
- Schema 13 adds athlete-confirmed exercise roles without rewriting workout labels. The evidence model keeps working load, estimated capacity, training max, known 1RM and legacy profile benchmarks separate.
- Schema 14 adds optional session intent and immutable planned-work snapshots inside saved workouts. Planned sets, target RPE and source provenance remain separate from completed sets and actual RPE; missing plans are unknown rather than failed adherence.
- Newly saved workouts include save timestamps and creation revisions. Historical as-recorded snapshots reverse later workout revisions; legacy records without save timestamps remain usable but are flagged as incomplete replay evidence.
- Replacement imports expose collection-level added/changed/removed counts and include the prior state as one of three local recovery snapshots. Portable JSON exports omit nested recovery payloads.
- Derived workout PRs are reconciled when sessions change; independent manual and legacy benchmarks are preserved.
- History uses pages of naturally sized cards, not fixed-height virtualization.
- Progress series separate reps, timed holds and cardio. Rep-based estimates use the core estimator with optional RPE; actual load remains a separate metric.
- Fatigue scoring requires 28 days of history and three distinct recent training days. Plateau labels use the analytics minimum-session guard. These are product heuristics, not clinical diagnoses.
- Draft migration preserves named fields, units, completion, order, edit context and optional prescription snapshots. Schema 12 wraps integrity metadata around the existing workout payload shape.
- Persistence serializes snapshots. IndexedDB resolves on transaction completion. Marked localStorage fallback remains preferred after reload to avoid reviving stale IndexedDB data.
- Primary app state remains device-local. v2.59 can manually synchronize the structured account record across signed-in devices using a device-only shared base, conflict-first three-way merge and server revisions. v2.60 adds server-side account/remote-snapshot deletion while intentionally leaving local training intact. v2.61 adds a read/route lifecycle layer over existing program, Calendar, review, event and handoff records; it does not create a parallel prescription store. v2.62 adds a UI-only gym-floor layer over the same workout draft/session state; it does not introduce another workout schema or network dependency. v2.63 makes online Coach an authenticated server-mediated feature: the browser supplies bounded structured context, while provider credentials/configuration, the trusted system prompt and provider-response validation stay on the server. v2.66 adds a derived cycle-observability layer over the same authoritative program/review/Calendar/workout/event/transition records; it freezes missing decision metadata on new records but does not introduce a parallel event store. Background sync and simultaneous-tab coordination are not implemented.
- Decision-readiness results are evidence-quality classifications, not training prescriptions. The v2 decision engine remains disabled.

## Remaining boundaries

Continue extracting legacy orchestration only with regression coverage. Some non-workout inline handlers remain. Retired technique-review code is archived, while saved form-review records remain intact. Styles and charts are now generated into committed assets; food lookup and online coaching still require a connection.

The service worker caches each release's complete app shell without background replacement. app-lifecycle.js presents waiting updates, saves drafts/data before explicit activation and blocks activation while other app tabs are open. Old caches are retained for open pages; cache reclamation remains follow-up work. Browser eviction can still remove local caches/data, so exports remain important. Release labels are checked against `package.json`.


### v2.65 phase policy

`cycle-phase-policy.js` is the pure authority for which bounded cycle actions are available in accumulation, strength, peaking, taper and event transitions. `cycle-review.js` owns evidence eligibility and future-only Calendar revisions; `cycle-adaptive-controller.js` chooses among only those already-eligible actions. This keeps phase semantics separate from evidence collection and mutation.


### v2.66 cycle observability boundary

`cycle-observability.js` owns canonical decision fingerprints, release/schema/policy environment snapshots, deterministic controller replay, the derived meet-cycle journal and decision-data audit. It does not own workouts, Calendar records, programs, event results or transition data. Those records remain authoritative in their existing modules.

`phase-builder.js` and `meet-cycle.js` attach additive decision-environment metadata when new records are reviewed. `cycle-review.js` stores the controller snapshot that the athlete actually saw separately from the athlete's approved choices and the resulting Calendar revisions. `transition-baseline.js` carries those frozen controller snapshots into the immutable meet-cycle handoff. Legacy records without v2.66 metadata remain valid and are reported as non-blocking observability limitations.

No generic analytics/event ledger is introduced. The Cycle Journal is reconstructed from existing records so observability cannot drift into a second source of training truth.
