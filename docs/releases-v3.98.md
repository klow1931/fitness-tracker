# Loadnote v3.98.0 — Gym-Floor Logging

## Goal

Make logging an actual workout between sets require as little effort as possible without hiding unknown loads, inventing actual RPE, changing prescriptions, or losing an unfinished draft.

## Implemented

- **Ready-to-log state:** quick RPE and Done without RPE buttons require an explicit performed load. The hint says to enter **0** for bodyweight or no added load. The same validation is enforced by the underlying quick-completion helper so alternate completion paths cannot silently bypass it.
- **Actual RPE:** tapping an RPE chip both enters that effort and checks the set. Tapping **Done without RPE** leaves actual effort blank, even when the input previously held a typed number. Undo restores the earlier typed effort, load, reps and completion state.
- **Quick reuse:** an explicitly entered zero is not mistaken for a blank field and is never overwritten by the one-tap same-set filler; a source set without a recorded load cannot populate a destination. History-based reuse still shows previous performance but only offers **Use last session** when the previous load is known. No RPE or completion is copied.
- **Rest keyboard:** Use target, Use last set, load adjustment and same-set / previous-session reuse avoid programmatic input focus during an active rest timer. Manual entry remains possible. No additional completion dialogs are introduced.

## Acceptance gates

| ID | Criterion | Evidence |
| --- | --- | --- |
| AC-01 | One tap from Home starts today's scheduled workout at an actionable set | Existing `tests/browser/training-loop.spec.js` |
| AC-02 | One tap selects actual RPE and checks a set; intentionally unknown RPE stays blank | Existing training-loop tests and `tests/browser/v398-gym-floor.spec.js` |
| AC-03 | Blank load cannot complete; explicit zero can; invalid completion doesn't start rest | `tests/logger-quick-entry.test.js` plus v3.98 browser tests |
| AC-04 | Next unfinished set and rest timer remain accessible without an unexpected keyboard | Existing gym-floor and training-loop tests; v3.98 browser rest tests |
| AC-05 | Previous and planned performance are distinguished; copied entries don't copy actual RPE / done | Existing gym-floor/cockpit tests and v3.98 zero-load test |
| AC-06 | Interrupted and offline drafts restore what was entered; storage failure is explicit | Existing `tests/browser/draft-recovery.spec.js` and `tests/browser/training-loop.spec.js` |
| AC-07 | History is only changed after explicit review/save; duplicate writes are prevented | Existing workout-save and training-loop regression coverage |

All available automated CI checks must pass for this change. The v3.98 browser regression is included in mobile WebKit CI. Physical iPhone Home Screen and Android device acceptance remain **unverified** until performed by a tester; emulator and browser checks alone do not establish real-device keyboard ergonomics.

## Data and release safety

- Version **3.98.0**, unsigned build **35800**; schema **34** unchanged.
- Internal weight storage remains kilograms. No migrations or reinterpretation of old workout histories.
- Draft storage keys and existing recovery behavior unchanged.
- No automatic prescription/adaptive changes; no new account, sync or online features.
- Base revision is the last known-good v3.97.0 merge; retain it for rollback.
