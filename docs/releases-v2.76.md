# Loadnote v2.76.0

## Calm Navigation & Information Hierarchy

### Changed

- Kept the primary product structure focused on Home, Train, Progress, Coach, and Profile.
- Demoted global unit, appearance, and Gym mode controls from the header; these remain available in Profile preferences.
- Simplified Home around today's training and current training context.
- Removed duplicate Start Here content and nutrition/demo-data prompts from the normal Home hierarchy.
- Removed Home protein/nutrition cards from the primary training experience while preserving Nutrition under Profile.
- Clarified the deeper Home disclosure as Training insights & history.
- Kept v2.75's execution-first workout logger unchanged.
- Made Progress detail surfaces visually quieter without removing evidence or record controls.
- Moved legacy generator/library UI one level deeper under Advanced programming.
- Refined Profile into the home for training setup, account/data, preferences, and secondary features.

### Integrity

- Schema remains v25; no migration.
- Internal weight storage remains kg.
- No changes to workout or draft persistence.
- No changes to RPE, estimated 1RM, training-max math, progression thresholds, adaptive policy, fatigue/status calculations, phase progression, or meet-cycle progression.

### Tests

- Added Playwright coverage for the calm global header, Profile-owned preferences, training-first Home hierarchy, and advanced-programming disclosure.
- Full repository static, unit, mobile, and desktop/mobile browser checks are required before merge.
