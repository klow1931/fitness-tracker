# Loadnote v1.0 — Athlete

Loadnote is an offline-first training log with deterministic training intelligence, adaptive programming, and an optional AI Coach.

## Run locally

Open `index.html` in a modern browser for the browser build. For the full project workflow, use Node.js and the scripts in `package.json`.

```bash
npm test
npm run check
```

## Core product loop

Workout → RPE → Analysis → Adaptive decision → Next workout → Coach explanation

## v1.0 additions

- Athlete command center on the Dashboard
- Current training status and performance direction
- Active program / next-session context
- Schema v10 release migration
- Release/data-quality assessment helper

## Important

The current app is local/offline-first. The optional backend in `backend/server.js` is a development architecture for the AI Coach; production deployment, authentication, cloud sync, billing, store signing, and legal/compliance setup are separate release tasks.
