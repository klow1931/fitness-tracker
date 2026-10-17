# Loadnote v3.40 — Phase 2 adaptive programming foundation

Combines the proposed v3.38 (simpler creation), v3.39 (explainable adaptation) and v3.40 (full-cycle validation) work on top of the merged v3.37 release.

## Guided strength programming
- The existing strength designer defaults to a simple three-stage guided process. Schedule, explicitly chosen competition-lift training maxes, and a final review remain the main path.
- Advanced loading style, phase duration, load increments and naming remain editable behind **Advanced cycle options**. Existing saved programs are unchanged.
- `program-setup-policy.js` makes conservative, deterministic style suggestions from the athlete's saved availability, experience and consistency. Beginner, returning, sparse-frequency or unknown setup remains linear. A consistent intermediate/advanced athlete with at least three training days may see daily undulation proposed. All athletes can choose linear, undulating, weekly undulating or waves.
- No inferred training max, automatic exercise mapping, automatic accessory dose or unsupported individual optimality claim.

## Adaptation evidence
- Reuses the established phase-review engine and the existing explicit approval path; no second decision engine or hidden autonomous writes.
- New read-only per-lift explanation explicitly distinguishes **What changed?**, **Why?** and **What evidence was used?**, including completed/expected sessions, matched sets, actual RPE, repeat effort-cap differences and eligible competition-lift capacity comparisons.
- An incomplete session, missing/invalid RPE, changed plan, unsupported rest/recovery context, workout edit or insufficient repeated competition-lift observations continues to block automatic progression. 'Keep' remains the default and no saved workouts are altered by reviewing advice.
- The stored weights remain kilograms. Display conversions happen only at UI boundaries. Review acceptance continues using the existing fingerprint, future-only schedule revision and data-recovery rules.

## Whole-cycle validation
- Existing deterministic meet-cycle simulation now covers 8, 12, 16, 20 and 24 weeks with 3/5-day, kg/lb, beginner/advanced, sparse history and both real and mock events.
- Explicit constraints are checked for equipment, program length, dates, chosen maxes, deload/peaking/taper guardrails and incomplete evidence.
- Simulations and UI regression tests are not substitutes for actual athlete testing; physical Android/iPhone force-close, offline coaching, and long-cycle coaching evaluation are still pending.

## Review gates
Run `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native` and the full browser + iPhone WebKit checks; merge only after validation is green.
