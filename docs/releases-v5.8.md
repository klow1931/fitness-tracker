# Loadnote v5.8.0 — Approved Coach continuity

**Version:** 5.8.0 · **unsigned build:** 37800 · **schema:** 34 unchanged.

This is an opt-in, local-only **Things Coach remembers** feature built on merged v5.7, not automatic conversational data collection.

## What works

- Add, review, edit, delete one or clear all approved notes. Each write or destructive change must be explicitly confirmed. Chat replies merely offer a review action and **never save text**.
- Four bounded note types: preferred name, non-sensitive personal training reason, routine cue, and next-visit check-in. Health/diagnosis, private finance, political and other highly sensitive details are not accepted as Coach memory. Training preferences, exercise identities, actual logs, RPE and prescriptions stay in their canonical systems rather than being copied into memories.
- Saved notes retain ID, type, text, approval via explicit UI confirmation, source (manual reviewer), created/updated timestamps, optional expiry and a visit marker. The note store uses version 1 and a limited list of up to 12 entries, separate from training schema 34.
- A selected **next-visit** note becomes visible once on the first quick Coach opening in a new app session (not a timed alert, push notification, or background task). The person can remove it at any time. Other notes can be reviewed through the memory screen or by asking what Coach remembers.
- The memory UI is available from the full Coach, quick Coach, Profile and explicit chat actions. A scope check prevents stale dialogs from writing after account transitions. Previous memory-derived chat is cleared when the active account scope changes.
- The device-local record is isolated by local-device versus authenticated account ID. Unknown identity blocks memory operations. Account spaces have separate local records and there is no implicit promotion of local notes into an account.
- Memory is **not part of** the training backup, remote account sync or online chat context. Separate JSON export/import has strict schema, scope, ID, timestamps, expiry, size and optimistic-revision checks; restore replaces notes only after explicit review. Existing workout records are never replaced or modified by memory import.
- Storage read/parse/quota failures are visible. Corrupt memory is not silently overwritten or treated as valid. A storage deletion is verified before success is reported.

## Product and privacy boundaries

No transcript persistence, automatic sentiment analysis, user-inferred private facts, autonomous training dose changes or device model downloads. A user-reported saved note is **not evidence** of logged training progress or a confirmed Profile field.

This v5.8 version provides **device-local continuity**, not a cross-device or encrypted personal vault. Browser data deletion, uninstall or device loss can remove local memory; exported JSON contains readable personal text. Browser downloads and restoration must be manually verified on supported native devices, and the in-app training backup does not cover memory. Cloud sync support would require a separately reviewed contract. The currently opened account uses local scope, not a remote encrypted storage service.

## Verification

- Unit test `tests/v58-coach-memory.test.js`: consent-only CRUD, optimistic conflicts, sensitive-content rejection, future visit, profile/account isolation, corrupt/quota failures, restore scope and data immutability.
- Browser test `tests/browser/v58-coach-memory.spec.js`: full Coach actions, explicit save, reload, edit, delete, clear, quick-panel follow-up, account transition, wrong-account import rejection, correct restore, mobile width.
- Full `npm run check`, `npm test`, Coach understanding evaluation, Chromium shards, mobile WebKit, unsigned Android/iOS and offline beta gates. Physical iPhone and Android airplane-mode / persistence acceptance remains necessary.

## Rollback and migration

Version 5.8.0 / unsigned 37800; **training schema 34 unchanged**. New independent local-memory key `loadnote.coach-memory.v1.<scope>` with record schema 1. No automatic migration because this storage did not exist before v5.8. Existing saved reply-length settings are unaffected. v5.7 remains the known-good rollback point until checks and acceptance pass.

Next: v5.9 authored response composition to reduce repetition, with controlled use of reviewed memories only when pertinent.