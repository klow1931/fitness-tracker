# Loadnote v3.10.0

Weekly loading and feature validation, build 31000. Schema 32 unchanged.

- Weekly undulating alternates volume and intensity weeks inside accumulation/strength. Accumulation uses 6/4 reps at 65/70% plus a selected step per two-week pair; strength uses 4/2 reps at 75/80% plus that pair step. Light work retains its 7.5-point reduction. Strength back-off sets use 6/4 reps at the existing 7.5-point lower target. Loads retain the existing floor-to-increment kg contract, 85% ceiling, time limits and effort caps. Partial pairs stop at phase boundaries.
- It is a manually selectable option, not an automatic claim of athlete suitability. Decisions still explains its existing linear/daily-undulating setup rule. Phase structure and loading style are explained separately.
- Existing linear/wave/daily-undulating configurations replay unchanged. New records freeze the `phase-weekly-undulating-v1` policy identity. No migration, original-plan rewrite or change to adaptive thresholds, RPE/e1RM/training-max calculations is introduced.
- Meet base phases use the selected style, including existing hold behavior beyond six supported progressive weeks. Deload, peaking, taper and event-week behavior are unchanged. Saving and scheduling remain separate, explicit approvals.
- README current-state guidance supersedes labeled historical notes. Static-server commands, schema, navigation, signed-in service requirements, local AI limitations and unsigned-native status are corrected. Architecture no longer incorrectly calls the deterministic decision layer disabled.

See the feature-demo matrix for scope, validation results and issues. Browser mocks do not establish real AI quality, production service readiness, physical Safari behavior or signed store distribution.
