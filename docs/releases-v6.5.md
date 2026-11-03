# Loadnote v6.5.0 — Safe opt-in confirmed load fill

**Version:** 6.5.0 · **unsigned native build:** 38500 · **training schema:** 34 unchanged.

During an unfinished strength set, Train already shows **Last confirmed** when corrected saved workout history supports the exact same rep count. In v6.5, a **Use confirmed load** button appears beside this evidence **only if the athlete's current load field is blank** and the source contains a valid explicitly completed working-set weight.

Tapping fills **only** the current load in the athlete's selected display unit, converted once from canonical stored kg. The logger's normal draft-saving path remains authoritative. The action does not overwrite a typed load—including explicit 0—nor does it change entered reps, RPE, set completion, planned targets, saved history or future progression. It is an optional quick entry, not a recommendation that the saved load is appropriate today.

History eligibility uses the v6.4 correction-aware, strict exercise-identity and same-rep filters. The value is **revalidated at the moment of tapping**, so a changed exercise, rep count, saved workout correction or completed set cannot authorize a stale action. Missing load, invalid weights, ambiguous aliases, unconfirmed or missing history disable it. A confirmed historical 0 kg is a legitimate bodyweight entry.

The button disappears once a load is entered. It does not force keyboard focus while the rest timer is active. The original **Use last set**, **Use target**, Coach and workout-logging flows remain intact. No new storage schema, data migration, cloud request, API key or automatic training decision is introduced.

**Validation:** full Node/static test suite, desktop/mobile Chromium, actual iPhone WebKit acceptance, Android/iOS compilation, CodeQL, and on-device offline logging, kg/lb and timer checks. Preserve v6.4.0 on main for rollback until all gates pass.
