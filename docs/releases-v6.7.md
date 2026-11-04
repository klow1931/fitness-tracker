# Loadnote v6.7.0 — Reliable unfinished-workout checkpoints

**Version:** 6.7.0 · **unsigned native build:** 38700 · **training schema:** 34 unchanged.

## What changed

Loadnote saves each unfinished workout in two browser-local checkpoints. In v6.6, if the **primary** write failed but the **recovery** write succeeded, Loadnote displayed an unsaved warning even though the newest work was recoverable. v6.7 makes that status accurate.

There are now four distinct outcomes:

- **Two copies saved:** ordinary saved confirmation.
- **Primary only:** draft saved on this device, recovery copy unavailable; retry to restore the second copy.
- **Recovery only:** draft saved in recovery copy, main copy unavailable; retry to restore the second copy.
- **Neither saved:** warn to keep the page open and retry, because the latest edits were not checkpointed.

A discreet **Retry draft save** action is visible directly in Train for both degraded (one copy) and failed (zero copies) states. It writes the *current* logger state again and does not alter any workout content. A single copy is **recoverable** but has reduced redundancy; neither copy is not safe to abandon.

## Integrity and compatibility

Draft recovery continues to select the newest **valid** checkpoint using its saved timestamp; a newer recovery copy wins over an old primary. The existing draft v3 format, storage keys, and completed-workout schema 34 remain unchanged. Recovery never creates a saved workout or PR, and committing a real workout still clears both checkpoints. Weight units, checked sets, actual RPE, program context and previous functionality are preserved.

Local storage is **not permanent backup**: clearing app/browser data or storage eviction may remove both copies. Training-data export is separate and does not contain unfinished sets.

## Release verification

Run all Node/static checks, desktop/mobile Chromium regressions, actual iPhone WebKit acceptance for all partial-write modes and reloading recovered entries, Android/iOS compilation, beta and CodeQL, followed by hands-on offline PWA/device testing. Preserve merged v6.6 on main until checks pass.
