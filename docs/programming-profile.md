# Constraint-aware programming profile (v2.13)

Use **Decisions → Programs → Programming profile** before building a proposal. The profile records a primary goal, optional meet date, self-reported experience and consistency, available weekdays, maximum session minutes, equipment access, preferred/avoided exercise IDs, priorities and notes.

## Enforced versus reported context

The existing four-week builder enforces:

- Program days must be a subset of available days; availability is not a prescribed frequency. Defaults select a supported subset, which the athlete reviews.
- The selected time budget cannot exceed the profile. The builder's existing rough session-duration estimate must also fit it. This estimate is not a guarantee of actual workout duration.
- Barbell, suitable plates, rack and bench must be available. The builder does not silently substitute equipment.
- Competition exercise IDs cannot be marked avoided. Name aliases do not bypass the ID constraint. Preferred and avoided selections are mutually exclusive.
- A Return goal or Returning consistency permits only the existing return/base structure. This is a conservative product rule, not a validated individualized dose.
- Dedicated hypertrophy and meet-preparation goals remain accurately recorded, but this limited builder refuses to produce those plans. It does not silently relabel a strength template as meet prep.
- Any recorded meet within 34 days of the proposed start (or earlier) blocks this base/strength builder, as with existing linked athlete goals. No taper or attempt selection is generated.

Experience, preferences, priorities and free-text notes are visible context. They are **not** automatically interpreted as weaknesses, converted to exercise prescriptions or used to infer optimal volume. Preferred accessories not supported by this competition-lift-only builder produce a visible warning. Hard restrictions must use the structured controls, not notes alone. The selected athlete goal's constraints also apply; conflicts are surfaced rather than one source silently overriding another.

Training maxes remain explicit builder inputs in kg; display conversion is unchanged. Neither known 1RMs, goal targets nor estimated capacity populate training maxes automatically. This release does not add readiness scores or infer consistency from incomplete logs.

## History and compatibility

Schema 20 adds `programmingProfiles: []`. Each revision has version, stable revision ID, recording timestamp and structured context; a null context clears the active profile while retaining its history. Validation rejects malformed, duplicate or nonchronological revisions. `current(records, knownAt)` supports chronological lookup.

New reviewed programs retain a `profileSnapshot` of the revision used during generation. Saving rechecks the entire proposal; scheduling rechecks the snapshot against the current profile. Any profile revision, including clearing it, requires a fresh program review before scheduling. Existing scheduled sessions, workouts, training blocks, goals and original programs are not rewritten. Old reviewed programs without snapshots remain readable and usable without a current profile; adding a profile requires those unscheduled programs to be reviewed again.

Profile history and program snapshots participate in existing JSON export/import and recovery snapshots. Import previews include revision counts. Older backups remain importable with an empty profile history. CSV is not a full backup. Failed persistence does not adopt the candidate profile state.

Automated tests cover revisions, clearing, chronology, malformed imports, profile constraints, stale preview/scheduling, immutable snapshots, legacy migration, offline reload, responsive UI, backup round trips and failed writes. Physical iPhone validation remains separate from Chromium mobile emulation.
