# Loadnote v3.24.0 — Audit fixes

## Behavior changes

Loaded prescriptions, templates and repeated sessions require explicit completion of actual strength sets or cardio before saving. A target alone, or changing a target without marking it performed, does not count as actual training. The review excludes unchecked work; a completely untouched plan cannot create a completed workout. Partial saves retain the original prescription and show the actual performed count. Existing saved-workout corrections and free manual entry are preserved. Historical workouts are not retroactively rewritten because their performance cannot be reconstructed reliably.

New athletes can name or select three competition movements and approve role mappings before opening the designer. This creates stable catalog identities and revisioned role records without creating workouts. Mapping replacement preserves prior role history, resolves existing aliases and requires distinct lift identities.

Reviewed meet cycles expose Schedule N workouts above their details and focus that action after saving. Scheduling remains a separate explicit action. Previews show training-max denominators, rounded-load percentages, final peak-session timing and event-week session counts. No intensity policy or training dose was silently changed; these remain athlete-reviewed programming inputs.

A program with a linked completed session before its original start is active. Competing active/early-started programs remain ambiguous. Original approved plan dates are preserved. Generic meet-cycle wording supports competition and mock events. Structural-integrity messages no longer imply that the app verified training performance.

## Validation

Model regressions cover untouched/edited-but-unperformed plans, partial sets, recovery, free entry, edits, template capture, cardio, holds, fresh identity setup, alias reuse, role replacement history, a no-history program preview, rolling-window cutoff dates and early execution. Browser regressions exercise untouched-plan rejection, reload and partial saving, plus clean-profile identity confirmation and meet-setup review on desktop and mobile. Existing planned-save browser scenarios now explicitly mark the performed sets complete.

Run npm run check, npm test, npm run check:mobile, npm run check:native and npx playwright test. CI runs the focused audit browser tests and the existing full browser shards. Local browser execution requires the Playwright Chromium download. Engineering checks do not establish that an individual athlete's program is optimal or replace physical-device acceptance.
