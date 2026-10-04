# Loadnote v2.90.0 — Mobile Reliability & Recovery

- Draft write failures stay visible during execution and fast-start layouts, with an explicit retry. Existing background checkpoints and refresh recovery remain unchanged.
- Workout review displays saving/failure state persistently. Failed durable commits preserve entered work and existing history; retry uses the same reviewed workout identity.
- Training-data save status reflects the latest queued write, not an earlier completed operation. Failed background saves offer retry of current training data.
- App updates use the same acknowledged draft checkpoint and remain paused if it fails.
- Invalid persistence snapshots reject through the writer Promise without breaking later writes.
- Backup help explicitly excludes unfinished drafts and distinguishes downloaded/shared files from verified external backups. Existing import previews, recovery snapshots and native share safety remain authoritative.

New coverage checks overlapping writes, quota failure/retry, offline strength/cardio/notes/units recovery, failed commit/retry/restart and legacy draft migration. Existing offline update, backup, import, edit, exercise mapping and program regressions remain in the full suite.

Schema 25, training calculations and history structures are unchanged. Native build 29000 remains unsigned development. Browser lifecycle tests do not establish native process-kill or physical-device durability; iPhone/Android backgrounding, low-storage, force-close and reinstall acceptance remain NOT RUN pending device testing. No enrollment, signing, TestFlight or store submission is performed.
