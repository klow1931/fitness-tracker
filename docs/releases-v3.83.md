# Loadnote v3.83.0 — Distinguishing saved from repeated exercise choices

## Athlete-visible update

The offline Coach answers **“What exercise swaps have I repeated?”** and related questions using the established deterministic longitudinal Coach. It identifies three distinct kinds of information:

- **Confirmed saved preferences:** explicitly saved preferred and excluded exercises in the Programming Profile at the requested date and time.
- **Athlete-authored Calendar edits:** edits made with explicit approval, grouped by their recorded reason (preference, equipment, time, symptoms, coach, other).
- **Reviewable, unconfirmed repeated choices:** existing Program Edit suggestions supported by at least two distinct edited sessions. Only confirmed preference/equipment removals are eligible; the Coach never adopts them automatically.

As-of questions exclude later edits or profile revisions. When a later same-day edit could influence a repeated-removal suggestion, the suggestion is withheld rather than retroactively shown. Edit history and preference choices do not prove which exercise improves performance.

## Integrity

The module reuses `program-edit.js`, `programming-profile.js`, and the already-shipped longitudinal coaching engines. No new interface, hidden inferred memory, persistence schema, autonomous progression policy or training data write. Stored weights remain in kg; schema 34 and RPE calculations are unchanged. Future programming continues to require existing explicit athlete approval.

## Testing and release requirements

New `tests/coach-choice-history.test.js` covers confirmed versus pending preferences, unique repeated edit sessions, missing profile, time cutoffs, medical routing and data immutability. Run Node syntax and unit suites, desktop/mobile Chromium and iPhone WebKit browser regressions, native packaging checks and Android/iOS compilation before release. Physical-device Home Screen/offline update and backup/save/relaunch acceptance remain manual gates.

Version **3.83.0**, unsigned native beta **34300**. Preserve v3.82 as rollback.
