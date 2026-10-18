# Loadnote v3.60.0 — Unified Athlete Confidence & Meet Prep

Status: engineering release candidate, building directly on merged v3.59. This is **one coordinated update** combining the three recommended tracks. It is not a store-approved release or a physical-device acceptance report.

## 1. Restore confidence

- Restore review now runs a read-only migration preflight. Compare source versus current-normalized schema, workout/revision/PR/schedule counts and identities, dated workouts, numeric set values and chosen display units. An unexplained change blocks replacement instead of silently dropping training history.
- Keep the existing backup fingerprint validation and explicit Replace action. Older backups without a manifest are identified as unverified; their preflight checks are not a cryptographic guarantee.
- If another local change occurs after preview, Save refuses to overwrite it and requires the athlete to review the backup again. An interrupted/failed save keeps the most recent local data rather than applying the stale preview state.
- Synthetic schema-22/lb tests are committed. A privately supplied v2.18 backup was separately read-only checked in development: 20 workouts, 11 workout revisions and 30 PRs remained byte-identical in those fields after migration to schema 32, and lb display preference remained lb. Its contents are **not** part of this repository or CI.

## 2. Coach actions with athlete control

- Supported explicit commands can propose a complete equipment list (barbell/plates/rack/bench), a numeric 30–240-minute session duration, or a stated training priority. Unsupported or ambiguous commands are not converted to saved preferences.
- Proposed fields flow into the existing Profile review card; it displays current versus requested values and rejects stale profile revisions. Only a separate athlete Save persists a new profile revision. No workout, set, scheduled training or historical prescription changes occur in chat.
- Existing evidence summaries can navigate to the actual Progress page, workout logger or movement mapping screen. Navigation is not an approval or automatic programming change.

## 3. Complete meet-prep timeline

- A requested 7–52-week prep remains the full duration through lift setup and the athlete-confirmed event date. A compact five-stage timeline shows exact week/date ranges, proposed sessions and event-week limits before the athlete saves.
- Review the existing lift days and session-time budget in that preview. Highlight currently scheduled Calendar sessions overlapping the window; the existing scheduler prevents an overlapping write.
- The bounded preparation engine, frozen training-max snapshots, quality gate, athlete approval and separate scheduling remain unchanged. No inferred meet attempt, medical advice, or automatic progression is added.

## Validation and release gates

- `npm run check`, `npm test`, `npm run check:mobile`, `npm run check:native`, `npm run check:beta` and all GitHub Chromium/WebKit workflows must pass.
- Run the [v3.60 combined pilot](unified-v3.60-pilot.md) on actual Android and iPhone devices: local restore after forced closure, interrupted saving, kg/lb presentation, at least three real workout logs, explicit Coach preference review, and full meet-cycle understanding.
- Never commit genuine athlete backup JSON, account credentials or private workout data to the public repository. Restore only test copies on test devices after independently verifying the backup file.
- Schema remains **32**, internal load storage remains **kg**, native build **33404** remains local-only. Signing, production hosting, cross-device restore, athlete acceptance and store authorization are **not yet verified**.
