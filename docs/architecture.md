# Incremental module boundaries

## v1.3.1 ownership

| File | Responsibility |
| --- | --- |
| `state-store.js` | State defaults, normalization, IndexedDB adapter, fallback loading, scheduled saves and errors |
| `persistence.js` | Ordered snapshot writes |
| `data-transfer.js` | Existing JSON/CSV and photo-backup import/export |
| `workout-form.js` | Exercise/set controls and last-weight actions |
| `workout-templates.js` | Form filling, repeat/template lifecycle and rendering |
| `workout-history.js` | Cards, search, virtualization and delete action |
| `workout-events.js` | Scoped workout/review handlers, bound once |
| `units.js`, `rest-timer.js` | Unit display/conversion and rest timing |
| `src/core/ui-utils.js` | Shared debounce helper, loaded before history |

This is an incremental responsibility split, not an ES-module/framework rewrite. Existing global APIs remain compatibility boundaries for navigation and coaching. Production script order is tested. Retired technique-review code is archived and not loaded; its saved data is preserved. Nutrition/coaching and non-workout inline handlers remain outside this pass.

`app.js` still owns navigation and most feature orchestration. This release deliberately moves only small boundaries with regression coverage:

- `workout-session.js`: pure draft conversion, previous-session selection, immutable create/edit operations, and PR provenance. Edits preserve the original record ID and program metadata and check the opened record against current in-memory history.
- `session-ui.js`: review dialog, edit lifecycle, comparison tables, and durable save coordination. No history mutation occurs before a successful write. Review is a frozen form snapshot, rechecked before confirmation.

- `draft-model.js`: pure validation/normalization and v1-to-v2 draft migration. v2 contains named fields, display units, set completion, and program context; it does not depend on DOM field order.
- `workout-logger.js`: form capture, restoration, validation, and draft status. History remains in the existing data schema.
- `persistence.js`: serialized snapshot writes and explicit fallback marking. The app supplies IndexedDB/localStorage adapters; errors propagate to UI callers. IndexedDB resolves on transaction completion.
- `workout-history.js`: history-card presentation. IDs are HTML-escaped data attributes, never interpolated JavaScript arguments.

Remaining work: extract program and template orchestration behind tests; make rendering consistently DOM-based throughout the legacy app; review remaining non-workout inline handlers and import boundaries; replace CDN styling with a local build before claiming full offline support. No comprehensive security certification is implied by escaping the updated text paths.

State remains single-browser local storage. Simultaneous tabs and cross-device sync are not coordinated. Fallback mode intentionally remains on localStorage after reload until a later recovery/migration feature is designed; it must not silently prefer stale IndexedDB records.
