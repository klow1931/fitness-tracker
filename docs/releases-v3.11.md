# Loadnote v3.11.0

Interface clarity, build 31100. Schema 32 unchanged.

The interface audit covers static and generated summaries and selection labels in Home, Train, Progress, Coach, Profile and the Calendar, Nutrition, Measurements, Photos and Tools destinations. Short, already-clear labels and dynamic program/exercise/date identities are intentionally retained.

| Area | Organization and wording |
| --- | --- |
| Coach | Muscle workload, Weekly check-in, shorter evidence/follow-up labels; compact facts before actions and full evidence |
| Programming | Starter plans, Muscle-growth plan, Sport planners, More program tools; concise advanced setup and lift-review entries |
| Decisions | Clearer evidence, context, history and follow-up labels; existing recommendation status and safeguards retained |
| Home / Train / Progress | Plan & calendar and Planned workout; read-only follow-up descriptions shortened |
| Profile / Tools | Advanced setup, Data health, Recovery snapshots, Exercise names & aliases |
| Nutrition / Measurements / Photos / Calendar | Clear existing labels retained; Nutrition targets and prior-performance entry shortened |
| Selection menus | Native selects, option values and defaults retained; long review options shortened without removing dose/limit semantics; unknown check-in displayed as Not reported |

## Accessibility and safety

- Native `details`/`summary` and `select` controls stay native. No custom accordion roles, removed keyboard operation, forced one-open behavior or visual truncation.
- Active intake/tolerance/sport-review restrictions stay visible outside collapsed full evidence. Unknown effort and history coverage are explicit; sparse data never becomes zero stimulus or inferred recovery.
- Methodology and all exclusions remain in How counts work and Guidance & sources. Original weekly explanation remains in Full weekly evidence; details are not deleted.
- Mapped muscle tables keep every column with captions, scoped headers and a named focusable scroll container. Empty state avoids meaningless zero-row column headings.
- Check-in help is associated with the selects; confirmation, failure messages and review/apply workflows are unchanged.
- Touch targets and focus visibility receive browser regressions, including 320px bounds, Enter/Space expansion, empty/populated tables and training-data nonmutation.

Validation results and screenshot artifacts are recorded in the pull request. The user's v3.10 iPhone walkthrough is reported feedback, not a physical-device acceptance pass for v3.11. Physical Safari, screen-reader speech output, text enlargement and real native behavior still require device testing. Browser accessible-role/keyboard checks do not substitute for those checks.
