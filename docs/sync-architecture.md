# Sync architecture foundation

Loadnote v2.55 defines how structured user data can be compared and merged safely across devices before any account or cloud transport is introduced.

This release does **not** synchronize anything over the network. It establishes the data contract and conflict rules that a future authenticated sync service must follow.

## Goals

The sync foundation must preserve Loadnote's existing priorities:

- current workout history must not be silently overwritten
- planned-work and Calendar relationships must remain internally consistent
- historical revisions must remain auditable
- device preferences and provider/API configuration must not leak into account data
- concurrent edits must be surfaced rather than resolved with an unsafe last-write-wins rule
- deletion must only be interpreted relative to a known shared base
- sync infrastructure must not change kg/lb storage behavior or training calculations

## Protocol

The first structured sync package uses:

`loadnote-sync-v1`

A package contains:

- client identifier supplied by the future sync client
- creation timestamp
- Loadnote schema/release metadata
- a deterministic manifest
- the structured sync project

The package manifest fingerprints each stable-id record independently and then fingerprints the complete manifest. This is designed to detect accidental mutation, truncation, or stale package contents before merge planning.

The fingerprint is deterministic but **not cryptographic authentication**. Future server transport still requires authenticated requests, access control, transport security, and server-side integrity controls.

## Syncable structured collections

v2.55 includes the structured collections that make up Loadnote's current account/training record, including:

- workouts
- scheduled sessions
- workout revisions
- training blocks
- exercise catalog and exercise-role mappings
- athlete goals
- reviewed programs and program reviews
- programming profiles
- phase programs and reviews
- meet cycles
- adopted programs
- transition snapshots
- decision events
- templates
- PR records
- legacy goals/programs
- rest days
- nutrition records and food library
- bodyweight
- measurements
- form-review records

Every syncable collection record must have a stable ID. Missing or duplicate IDs block sync packaging.

Collection array position is not treated as identity. Records are compared by stable ID. If a future feature requires user-controlled ordering, that order should be stored explicitly rather than inferred from array position.

## Syncable documents

The initial protocol also handles a small set of singleton account documents:

- athlete profile
- exercise notes
- program state
- active program identity

These documents are compared using the same deterministic three-way conflict model.

## Device-local data

The following remain outside the v1 structured sync project:

- recovery snapshots
- progress-photo binary data
- API/provider configuration
- display unit preference
- measurement display preference
- dark mode
- Gym-mode preference
- onboarding state
- backup-banner/export metadata

Recovery snapshots are device-local safety artifacts, not account history.

Progress photos require a separate binary/blob synchronization design rather than embedding large data URLs into the first structured record protocol.

AI/provider configuration remains device/server configuration and must not become normal account-sync payload data. Provider secrets remain server-side.

## Three-way merge model

A safe sync requires three states:

1. **Base** — the last version both devices are known to share.
2. **Local** — the current device state.
3. **Remote** — the current server/other-device state.

For every record or singleton document, Loadnote compares each side to the shared base.

### Automatic resolution

A change is safely mergeable when:

- local and remote are identical
- local is unchanged from base and remote changed
- remote is unchanged from base and local changed
- both sides independently reached identical content

This allows safe creates, updates, and deletions when only one side changed the shared record.

### Conflict

A conflict is produced when both sides changed the same logical record differently.

Examples:

- local edits workout A while remote edits workout A differently
- local edits workout A while remote deletes workout A
- both devices create different records using the same stable ID
- both devices change the same athlete-profile document differently

v2.55 does **not** use "newest timestamp wins" or "last write wins" to hide these conflicts.

A future account UI should ask the user to resolve a real conflict or apply a domain-specific resolution rule that is demonstrably safe.

## Deletions

The protocol does not infer deletion merely because a record is absent from one arbitrary snapshot.

Deletion becomes meaningful only relative to the shared base.

Example:

- base contains workout A
- local still contains workout A unchanged
- remote no longer contains workout A

This can be interpreted as a remote deletion.

Without a known shared base, that same absence is ambiguous and must not be treated as an intentional delete.

## Relationship validation after merge

Record-level changes can be individually safe but collectively invalid.

Example:

- one device adds a workout linked to Calendar session A
- another device deletes Calendar session A
- the two changes affect different record IDs, so they do not create a record-level conflict
- combining them would create an orphaned workout-to-Calendar relationship

For this reason, v2.55 runs Loadnote's existing relationship-integrity audit after an otherwise mergeable three-way plan.

If the combined result creates blocking relationship problems, the merge is rejected as `invalid-merge`.

This is a critical requirement for future cloud sync: record-level conflict freedom does not automatically mean the resulting training state is valid.

## Preflight

Before creating a sync package, Loadnote performs a deterministic preflight.

It blocks packaging when:

- a syncable collection is malformed
- a record lacks a stable identity
- duplicate identities exist
- current workout/Calendar relationship integrity is already blocking

It does not automatically rewrite or repair those records.

## Future authenticated transport

A later milestone can place an authenticated transport around this model.

A future flow should roughly be:

1. authenticate the account
2. identify the current device/client
3. obtain the server revision and last acknowledged base
4. build and verify the local sync package
5. download the remote package/revision
6. run three-way merge planning locally or on a trusted server implementation using the same rules
7. stop and surface conflicts when necessary
8. validate relationship integrity
9. commit the merged revision atomically
10. persist the new shared base/revision only after the server confirms the commit

The server should use an account-scoped monotonically changing revision/token so two devices cannot unknowingly commit against different bases.

## Important non-goals in v2.55

v2.55 does not implement:

- user accounts
- authentication
- cloud storage
- network sync
- background sync
- remote backups
- subscriptions
- photo upload
- conflict-resolution UI
- server revision storage

Those belong to later commercial-readiness milestones.

The purpose of v2.55 is to make those future features safe to build without redesigning or silently compromising Loadnote's training history.
