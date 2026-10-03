# Loadnote v2.80.0 — Realtime Voice Companion

v2.80 turns the v2.79 Coach Companion into an opt-in spoken training companion while keeping the logger and deterministic Decisions authoritative.

## Added

- Explicit **Start voice** control inside Coach Companion.
- WebRTC microphone and spoken-response transport for low-latency conversation.
- Mute/unmute and End controls with visible microphone/session state.
- Final user and Coach transcript messages in the existing Companion conversation.
- Fresh live-workout and rest-timer function tools.
- Read-only bridge from realtime voice to the existing authenticated Coach for broader explanations.
- Authenticated + CSRF-protected `/api/voice/session` endpoint that exchanges a server-side provider credential for a short-lived Realtime client secret.
- Separate server-side voice provider configuration.
- Voice failure fallback that leaves text Companion, workout logging and Decisions available.

## Deliberate boundaries

- Voice cannot log or complete sets yet.
- Voice cannot write RPE/history.
- Voice cannot change programs, prescriptions, phase decisions or accepted adaptations.
- No app-closed wake word or background always-listening mode.
- Voice starts only after explicit athlete action and microphone permission.

## Data and training integrity

- Version: `2.80.0`
- Schema: v25 (unchanged)
- Internal strength storage: kg (unchanged)
- No migration
- No changes to kg/lb conversion, RPE/e1RM, training max, progression, fatigue/status, adaptive policy, mesocycle/phase progression, meet-cycle logic or workout-history semantics.

## Deployment

Realtime voice requires `LOADNOTE_VOICE_API_KEY` on the Loadnote backend. The standard provider credential is never placed in browser code or returned to the client; the client receives only a short-lived Realtime credential.
