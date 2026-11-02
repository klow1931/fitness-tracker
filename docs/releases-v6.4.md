# Loadnote v6.4.0 — Last confirmed same-rep history during logging

**Version:** 6.4.0 · **unsigned native build:** 38400 · **training schema:** 34 unchanged.

In Train, when a strength set has a positive integer rep count and a trustworthy saved match exists, the cockpit shows **Last confirmed** with the date, the **same rep count**, historical load in the current display unit, and recorded RPE (or "RPE unknown"). This context is **read-only** and separate from the existing ordinal **Last** context and the manual **Use last set** fill.

It searches the three most recent **corrected saved sessions before the open draft date**, using the same catalog alias/identity guardrails as offline Coach. Only **explicitly completed working sets** qualify; skipped, warm-up, incomplete, unmarked, same-day, and future sets cannot appear as confirmed evidence. An exact 0 kg bodyweight load remains valid. If there is no trustworthy match, the extra line is omitted rather than inventing one.

The existing logger remains authoritative, no weights/RPE/completion or progression targets are changed, and there are no new saved data structures, migrations, or AI secrets. This is not a medical, readiness, or progress claim.

**Release checks:** complete Node/static tests, desktop/mobile Chromium, actual iPhone WebKit, Android/iOS builds, security checks and hands-on PWA offline/weight-unit verification. Keep merged v6.3.0 on main for rollback until validated.
