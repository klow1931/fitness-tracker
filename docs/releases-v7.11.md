# Loadnote v7.11.0 — Clearer program setup

Version7.11.0 · unsigned native build40100 · schema34. Rollback approved source880a4d49652faa8d216494678babef52377db9d3, runtime7.10.0/build40000. Preserve that known-good release; this candidate requires Keith's review/merge and all guarded release gates before web publication. No native signing or distribution.

Equipment requirements now appear in the designer's first step. Missing saved barbell/plates/rack/bench access no longer appears as an invalid bench training max. Users can explicitly update actual access through the existing append-only Training setup revision mechanism without closing the designer or losing maxes. Failed storage leaves the saved profile unchanged and entered answers retryable. Real equipment restrictions remain enforced; the app does not assume access or change old programs/workouts.

A visible kg/lb program-load entry selector converts training maxes, variation maxes, load increments and accessory loads. Blank values stay blank; unchanged converted values retain their exact underlying kg value across repeated switches. The app-wide logger unit is preserved. Preview weights explicitly use the app's display unit; internal training values stay kg. No data migration or adaptive-policy change.

Beginner steps use plain titles: Schedule & equipment, Training maxes, Review your program. Long suggestions stay expandable; loading styles, durations, exposures, variations, accessories and full-field mode remain available. Numeric controls retain large mobile targets. No training max or actual RPE is invented.

Architecture: focused program-designer model/UI modules handle entry conversion and durable equipment access; existing phase-builder, programming profile, accessory editor and usability wizard are reused. Existing progression/mesocycles, e1RM/training max calculations, fatigue/training-status semantics and workout history remain authoritative.

Validation: Node business tests cover units/invalid values, missing equipment, append-only and stale revisions, unchanged history and preserved engine restrictions. Chromium/WebKit journeys cover the equipment error location, failed/retried access save, lb entry and repeated conversion including accessories, reviewed unscheduled program persistence, advanced capability access and320px/enlarged text. Complete Node/static/release/browser/native/emulator/security evidence is tracked in the PR and cycle issue; no unexecuted physical acceptance claimed.
