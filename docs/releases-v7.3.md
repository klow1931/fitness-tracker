# Loadnote v7.3.0 — Returning to training

Version 7.3.0 · unsigned native build 39300 · schema 34 unchanged.

Simple History promotes the existing repeat action as Repeat workout, alongside Edit. A short explanation distinguishes a new draft for today from editing a saved session. Other session actions remain expandable. The existing repeat implementation still owns replacement confirmation, display-unit conversion, blank actual RPE/completion, review, save and independent workout identity.

Active search/date/source/status/order descriptions and a single Clear filters action now sit outside optional filter controls in both views. Clearing uses the existing reset and returns pagination to page one. Invalid date ranges render a dedicated empty state and refresh reliability/duplicate information rather than leaving stale content. Empty unfiltered History offers Go to Train; this navigates to the existing logger without resetting a draft.

`history-view.js` is a pure, read-only projection of the existing controls. `history-clarity-ui.js` renders its description with textContent. Filtering, serialization and repeat/save engines are unchanged. No storage migration, unit convention, training schema or progression-policy change is required.

Rollback baseline: merged v7.2 commit `fc92654f1651555deb94dd0e2a0c4ccf934d2493`. This release stays on its own branch until validated and approved.

Validation covers label/range/order projection and immutability; real pounds repeat/save with independent identity and untouched original; cancellation with a live draft; draft reload; filter recovery and pagination; empty-History navigation; narrow/enlarged text and literal search. Existing Node, syntax, mobile/native-source/beta, full Chromium/WebKit, native compilation, Android beta/offline emulator and security CI remain release gates.

Native builds remain unsigned and local-only. Physical iPhone/Android keyboard, installation and low-storage acceptance remain outstanding.
