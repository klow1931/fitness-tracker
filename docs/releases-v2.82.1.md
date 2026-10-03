# Loadnote v2.82.1

## Coach Companion mobile and dark-mode fixes

- Fixes assistant Coach messages that rendered with a light card and light text in dark mode.
- Gives Companion messages, chips, inputs, borders, and metadata explicit dark-mode colors.
- Uses the dynamic mobile viewport (`dvh`) when available so iPhone Safari browser chrome does not push the Companion header off-screen.
- Makes the Companion panel a flex layout so the message history scrolls while the header, composer, Voice controls, and footer remain reachable.
- Enlarges the close control to a 44px touch target.
- Adds tap-outside and Escape dismissal as backup ways to close the Companion.
- Avoids automatically focusing the text field on phone-sized viewports when the Companion opens.

## Integrity

- Schema remains v25; no migration.
- No workout, history, programming, Decisions, adaptation, e1RM, training-max, fatigue/status, or meet-cycle logic changes.
- Internal strength load storage remains kg.
- Target RPE and actual RPE remain separate.

## Validation

- Adds a 390×667 mobile dark-mode browser regression test covering readable assistant messages, viewport containment, 44px close target, tap-outside dismissal, and Escape dismissal.
- Full static, unit, mobile packaging, and browser checks are required before merge.
