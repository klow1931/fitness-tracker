# Realtime Voice Companion — v2.80

## Product intent

v2.80 adds an explicit, workout-scoped spoken interface on top of the v2.79 Coach Companion. The athlete starts Voice Companion from Loadnote, speaks naturally, hears spoken responses, can mute or end the session, and keeps a visible text transcript.

Voice is an interface to Loadnote training context. It is not a second training engine.

## Authority boundaries

The existing workout logger remains authoritative for completed training and history. Decisions and the deterministic programming engines remain authoritative for prescriptions and adaptations.

v2.80 voice may:

- read the current workout, exercise, set, target, previous-performance context and rest state;
- start, pause, resume, extend or stop the reversible rest timer;
- delegate broader read-only training questions to the existing authenticated Coach;
- speak responses and surface final transcripts in the Companion panel.

v2.80 voice may not:

- log or complete a set;
- write RPE or performance data;
- edit workout history;
- change a prescription or program;
- accept an adaptation or phase decision;
- make medical, readiness or recovery diagnoses.

Hands-free training-data entry belongs in a later release after dedicated confirmation/undo and integrity testing.

## Security architecture

The browser never receives the standard provider API credential. `POST /api/voice/session` requires an authenticated Loadnote account and CSRF verification. The Loadnote backend creates a short-lived Realtime client secret using the server-side voice provider credential and returns only the ephemeral value to the client.

Voice provider configuration is separate from the existing text Coach provider so deployments can keep different providers/models without exposing either credential.

## Realtime transport

The browser uses WebRTC for microphone input and remote spoken audio. Control events and function calls use the WebRTC data channel. The session uses server voice-activity detection and supports interruption.

Voice starts only after an athlete gesture requests microphone access. When the app becomes hidden, the local microphone track is muted. End Voice stops local media tracks, closes the data channel and peer connection, and releases remote audio.

## Failure behavior

Realtime voice is optional. If microphone permission, credential issuance, provider setup, WebRTC negotiation, or the network fails, the workout logger and deterministic Decisions continue unaffected and the text Companion remains available.

## Data integrity

- Schema remains v25; no migration.
- Internal strength loads remain kg.
- Display weight/unit remain explicitly separate from `weightKg` in live context.
- No changes to RPE/e1RM, training max, progression, fatigue/status, phase progression, adaptive policy, meet-cycle logic or workout-history semantics.
