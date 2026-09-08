# Loadnote v0.5 — Coach 2.0

## Highlights
- Proactive coach snapshot on the Coach → Insights screen.
- Deterministic coach context built from Loadnote analytics.
- Structured AI response parser for consistent recommendations.
- Secure backend proxy scaffold in `backend/server.js`; provider secrets remain server-side.
- Backend is opt-in in the UI; offline deterministic coach remains the default.
- Database schema v5 with coach migration support.

## Local AI backend
Set environment variables and run `npm run start:coach`:

- `LOADNOTE_AI_API_KEY` — provider secret
- `LOADNOTE_AI_BASE_URL` — defaults to xAI-compatible `https://api.x.ai/v1`
- `LOADNOTE_AI_MODEL` — defaults to `grok-2-latest`
- `PORT` — defaults to `8787`

Then set Coach → Developer → Use secure Loadnote backend and use `http://localhost:8787/api/coach`.

Never put a production provider secret into `app.js`, `index.html`, or other browser-shipped files.
