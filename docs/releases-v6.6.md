# Loadnote v6.6.0 — Reversible confirmed-load quick fill

**Version:** 6.6.0 · **unsigned native build:** 38600 · **training schema:** 34 unchanged.

## Gym-floor flow

After an athlete taps v6.5's **Use confirmed load** for a blank strength-set load, an **Undo load fill** action appears in the Train cockpit. Undo restores exactly the originally blank load field, leaving the entered rep count, actual RPE, set completion, training targets, timer, and saved workout history untouched. There is no confirmation dialog or keyboard interruption, even during an active rest timer.

## Guardrails

Undo is strictly **temporary, local, and limited to the most recent confirmed-load fill**. It appears only while the *same DOM set* is still the active, unfinished strength set and the exercise name/identity, draft date, reps, display unit, and filled numeric field match the original fill. Manually typing or adjusting the load, using another load-fill shortcut, changing units or reps, completing the set, changing the exercise, or leaving Train invalidates it. If the lifter edits the load and types the same number again, the earlier undo still must not come back.

The undo snapshot stays in memory, never in durable workouts, backups, Coach memory, or device synchronization. Restoring uses the existing logger's input/change and draft-save flow. This is not a change to programming or an automated training decision. Loadnote's existing **Undo set completion** remains independent.

## Release verification

Run `npm run check`, `npm test`, full desktop/mobile Chromium shards, actual iPhone WebKit including `v66-confirmed-fill-undo.spec.js`, iOS/Android compilation, beta and CodeQL. Before merging, verify real-gym offline/PWA rest timer, rapid taps, keyboard handling, units, manual-entry integrity, and draft recovery on an actual mobile device.

Keep merged **v6.5.0** on main as rollback until validated.
