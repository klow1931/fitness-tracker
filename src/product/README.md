# Loadnote Product Module Boundaries

The legacy `app.js` remains the runtime entry point for compatibility. Workout forms/templates/history/events, state storage, import/export, units, timers, and session review now have dedicated owners. See `docs/architecture.md` for boundaries and remaining work. Global compatibility entry points remain intentionally available to other screens.

Business rules should be moved only after tests cover the extracted module.
