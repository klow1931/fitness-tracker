# Loadnote v3.5.0 — Mobile flow polish

This incremental UI update builds on merged v3.4.0. It fixes the title/description collisions shown in Cycle journal, Program reviews and Explore Progress. Direct and span-wrapped disclosure markup now use the same stacked layout with a dedicated chevron column. Scoped CSS preserves native details keyboard interaction and excludes workout logger and dialog controls.

Program management actions now share a compact two-column grid, with training preferences spanning the row. The primary program action remains separate and easy to find. Shorter descriptions and mobile card padding reduce scanning without removing features, coaching references or approval controls. Companion response actions retain 44-pixel touch targets.

## Walkthrough

`tests/browser/mobile-flow.spec.js` seeds a synthetic reviewed meet cycle and walks through Decisions, cycle journal, phase review, training preferences and Progress records. It checks stacked label geometry, horizontal overflow, dark/light layout and unchanged training state at 320, 390, 430 and 1280 pixels. It captures program-review, program-actions and Progress screenshots in Playwright's output for both CI projects.

Run `npx playwright test tests/browser/mobile-flow.spec.js` for the focused demo, then run the complete suite. These are Chromium interaction checks, not a claim of physical iPhone/Safari validation or local-model performance. On iPhone, inspect the same screens with Safari's toolbar expanded/collapsed, larger text, keyboard entry and the installed home-screen app. Do not clear website data.

## Architecture and rollback

No training engine, storage schema, migrations, model runtime or permissions change. UI logic and deterministic training behavior remain v3.4's implementation. Web, service-worker and native release metadata advance together to v3.5.0. Roll back to the merged v3.4 release if necessary; avoid clearing user storage.
