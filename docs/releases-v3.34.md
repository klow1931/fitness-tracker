# Loadnote v3.34.0 — Reliable previous-performance logging

## Scope
This release prioritizes workout-logging accuracy and a trustworthy **Last session / Use last / + Jump** experience. The existing logger and adaptive engines are preserved.

## Changes
- **Identity-first:** a previous-workout copy with a stable exercise ID now uses matching saved exercise IDs. A newer workout bearing the same display name but a different confirmed ID cannot override the correct one. A renamed exercise can still match when its stable ID is unchanged.
- **Legacy support:** an old workout without exercise IDs can be recalled using an exact exercise name when a uniquely supported newer identity is not available. When multiple distinct historical IDs share an unresolved name, Loadnote declines to guess.
- **Catalog collisions:** when a user's exercise label resolves to multiple catalog IDs or aliases, the in-logger auto-fill, manual Last weights, Gym Floor and cockpit previous-set controls withhold an uncertain copy until the identity is resolved.
- **Time and edit safety:** Fill Last weights, + Jump, Gym Floor and cockpit all respect the selected workout date. A future-dated record cannot inform an earlier workout. Editing an existing workout excludes that workout from the candidate history.
- **Provenance:** Gym Floor's last-set hint includes the historical workout date so the athlete can see how recent the copied set was.
- **Bodyweight guard:** + Jump does not add an unintended positive load to a historical set recorded at zero load. The previous reps/duration are retained; prior RPE and completion remain unfilled.

## Boundaries
- Saved performance stays in internal kg; conversions to kg/lb displays still use the existing units layer. No planned targets, RPE, PR calculations, recorded workouts, or training schema (32) are migrated or edited by this update.
- Returning null for uncertain exercise identities is intentional, not an automatic exercise merge. Review identities rather than copying from a similar-looking movement.
- Does not infer training progression or automatically increase next-session weights.

## Validation
- Enhanced `tests/workout-session.test.js` for ID/name conflicts, renames, legacy fallback, unsorted history, date cutoff, edit exclusion, and ambiguous catalog labels.
- Browser regression coverage for the logger's source date, rejected future/other-ID load, zero-load jump guard, and withheld uncertain quick fills.
- Full Node, Chromium/WebKit browser, Android beta, Android and iOS compilation checks are required before merge. Physical-device validation remains separate.
