# Loadnote v0.5 — Coach 2.0

## Added
- `src/coach/coach-engine.js` with deterministic context building, proactive insights, structured prompt, and response validation.
- Proactive Coach card with Analyze action.
- Secure backend proxy scaffold at `backend/server.js`.
- Backend URL and secure-backend settings.
- Coach schema migration from v4 to v5.
- Coach engine tests.
- `scripts/sync-www.js` to support Capacitor web asset sync.

## Changed
- AI chat can use the secure Loadnote backend instead of exposing provider credentials in the browser.
- BYO API-key mode is retained only as an explicit developer option.
- Coach context now includes deterministic trends, status, recent sets/RPE, nutrition, bodyweight, PRs, goals, and active program.
- AI responses are parsed into a constrained structured format before being rendered.

## Safety
- No provider API secret is included in this release.
- Backend mode defaults to off until configured.
- Deterministic coach remains available without AI.
