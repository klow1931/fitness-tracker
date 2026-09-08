# Loadnote Product Module Boundaries

The legacy `app.js` remains the runtime entry point for compatibility. Future refactors should extract, in order: storage, workout logging, programs/adaptive programming, analytics/training status, coach, UI/rendering, and export/import.

Business rules should be moved only after tests cover the extracted module.
