# Loadnote v3.70.0 — Combined v3.68–v3.70 Program Studio & Offline Coach Update

One deployable release combines three follow-on milestones on top of v3.67. The intermediate numbers are feature milestones, not separate installed builds; the final release version is **3.70.0**.

## v3.68 — Fast, reversible program authoring

- A new **Quick edit across weeks** area lets athletes copy a chosen week into a **currently empty** target week. It refuses to overwrite existing prescriptions and respects the 1,500-row limit.
- Replace an exact exercise name across a chosen week range with an athlete-confirmed action. Previously entered sets and reps remain for explicit review; **old loads and RPE caps are cleared** so a replacement never inherits another movement's effort target without review. Undo restores the previous draft. There is no mutation to any scheduled Calendar session.
- Bulk edits operate on the unfinished device-local Studio draft, are included in existing autosave/Undo, and still require full-program preview and explicit Save. Saved edits of an earlier program continue to record a reviewable diff and a reason before approval.

## v3.69 — More precise offline Custom Program Coach

- Explicit questions such as **“What's my next workout in my uploaded program?”** and **“Show my custom plan workout today”** use the currently approved, active Calendar prescription, including exact exercise rows and reviewed loads/RPE caps, with the athlete's chosen display units.
- An unscheduled plan is never presented as today's workout; a cancelled, superseded or missing session cannot silently become a new training day. This is a **read-only** answer. Logging an actual workout remains a separate athlete action.
- The program check now calls out empty weeks and large changes in prescribed strength-set counts without labeling them unsafe, claiming an optimal weekly dose, or making an automatic adaptation. Private edit explanations remain excluded without consent.

## v3.70 — Import review, small-screen usability and regressions

- A compact all-week coverage review lists planned training days, strength sets, cardio minutes, and exercise rows, including weeks with no sessions. A separate expandable detail still contains every scheduled exercise.
- A malformed import row now includes a direct **Go to exercise row** action, opening the correct editor page without discarding the rest of the file. Quick-edit controls wrap on iPhone-sized screens.
- Add pure-model tests and browser regressions for bulk editing, Undo, missing loads, exact offline Coach answers, row-error navigation and local draft recovery. The v3.66 staged Home Screen update process remains unchanged; the new cache version delivers these files together.

## Safety, compatibility and acceptance

- **No database schema migration:** schema remains 33. No workouts, PRs, logged sets or original reviewed programs are modified by the new helpers. Program edits are only applied to future Calendar dates through the separately reviewed replacement flow introduced in v3.65.
- Bulk movement replacements are not coaching recommendations. Athletes must review appropriateness, load and effort, especially when changing exercise variants.
- No network upload of original program files, model retraining on athlete data, medical diagnosis, inferred training prescription or guaranteed adaptation is introduced.
- Native version **3.70.0**, build **33450**. Passing automated checks does not replace physical iPhone Home Screen and Android acceptance. On iPhone, first export/verify a backup, then use the explicit safe-update flow, check the version, open Program Studio, import/edit a program, and confirm the app remains usable offline. Distinct Safari and Home Screen installs may have separate device-local stores.
