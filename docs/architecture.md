# Incremental module boundaries

`app.js` still owns navigation and most feature orchestration. This release deliberately moves only small boundaries with regression coverage:

- `draft-model.js`: pure validation/normalization and v1-to-v2 draft migration. v2 contains named fields, display units, set completion, and program context; it does not depend on DOM field order.
- `workout-logger.js`: form capture, restoration, validation, and draft status. History remains in the existing data schema.
- `persistence.js`: serialized snapshot writes and explicit fallback marking. The app supplies IndexedDB/localStorage adapters; errors propagate to UI callers. IndexedDB resolves on transaction completion.
- `workout-history.js`: history-card presentation. IDs are HTML-escaped data attributes, never interpolated JavaScript arguments.

Remaining work: extract program and template orchestration behind tests; make rendering consistently DOM-based throughout the legacy app; review remaining non-workout inline handlers and import boundaries; replace CDN styling with a local build before claiming full offline support. No comprehensive security certification is implied by escaping the updated text paths.

State remains single-browser local storage. Simultaneous tabs and cross-device sync are not coordinated. Fallback mode intentionally remains on localStorage after reload until a later recovery/migration feature is designed; it must not silently prefer stale IndexedDB records.
