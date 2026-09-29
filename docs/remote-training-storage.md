# Remote training storage and revision foundation

Loadnote v2.58 adds authenticated, account-scoped storage for one verified structured-training snapshot per account.

> **v2.59 update:** the consumer app now uses this storage through explicit **Sync now**. Each device retains an acknowledged shared base outside the account payload, performs deterministic three-way comparison, stops for real conflicts, creates a recovery snapshot before applying incoming data, and rechecks cloud freshness before pull-only application. Background/automatic sync remains off.

> **v2.60 update:** Profile adds self-service account deletion. The authenticated server removes the account-scoped remote training file before deleting the account identity. The initiating device then clears its local sync-base acknowledgement and receipt metadata; ordinary local training remains on-device.

This is **not automatic synchronization**. The server can store, return, and version a v2.55 sync package, but the normal Loadnote training flow does not automatically upload local history, download remote history into the device, or merge two devices.

## Why this milestone exists

v2.55 defined the deterministic sync package and three-way merge rules.

v2.56 established the signed account-session boundary.

v2.57 added verified OIDC identity and a durable account record.

v2.58 adds the missing server-side data primitive:

`authenticated account -> current remote snapshot -> monotonic revision`

That gives a later multi-device sync release a safe compare-and-swap boundary rather than relying on "latest timestamp wins."

## Stored data

Remote storage accepts only a verified `loadnote-sync-v1` package.

That package contains structured account/training data covered by the v2.55 protocol, including workouts, Calendar sessions, revisions, blocks, exercise identity/roles, programming records, PRs, nutrition, bodyweight and measurements.

The v1 package intentionally excludes:

- progress-photo binary data
- local recovery snapshots
- API/provider configuration
- device/display preferences

The server re-verifies every incoming package before it can become the current remote snapshot.

It also verifies persisted package integrity when reading a stored snapshot, so corrupted files fail closed instead of being returned as trustworthy remote training data.

## Package verification

For v2.58 remote storage, package verification now requires:

- supported sync protocol
- valid package timestamp
- bounded client identifier
- valid schema/release metadata
- the exact collection/document set defined by the protocol
- stable IDs with no duplicates
- manifest fingerprint matching package contents
- package metadata fingerprint matching the manifest
- no blocking workout/Calendar relationship-integrity problems

Unknown collection/document sets are rejected instead of being silently ignored.

This matters because silently dropping an unknown future collection would make a package appear valid while losing data.

## Account scoping

Remote snapshot endpoints never accept an account ID as authorization.

The server determines the account from the verified Loadnote session:

`session -> account -> remote store`

A client-supplied account ID cannot redirect a write into another user's storage.

Each account's file name is derived from a one-way SHA-256 key of the opaque Loadnote account ID rather than placing the raw account ID directly into a filesystem path.

## Revision model

Every account starts at remote revision:

`0`

Revision 0 means no snapshot has been committed.

A successful first commit becomes revision 1.

Each different successful commit increments the revision by exactly one.

Example:

```
revision 0  -> empty
revision 1  -> first verified snapshot
revision 2  -> later verified snapshot
revision 3  -> another accepted update
```

Revisions are server-authoritative.

## Compare-and-swap writes

A remote write must include:

- `expectedRevision`
- one verified sync package

The write succeeds only when the expected revision equals the server's current revision.

Example:

Device A reads revision 4.

Device B commits a different snapshot and creates revision 5.

Device A then tries to commit using `expectedRevision: 4`.

The server returns:

`409 revision_conflict`

and does not overwrite revision 5.

This is intentionally different from last-write-wins.

The conflict response includes current remote metadata so the client knows the remote state moved. The full remote package can then be fetched explicitly for later three-way comparison.

## Idempotent retries

Mobile networks fail in ambiguous ways.

A client can successfully commit a package and lose the HTTP response before learning that it succeeded.

For that reason, retrying the exact same verified package is idempotent.

If the package fingerprint already matches the current remote snapshot, the server returns the existing revision as `unchanged` rather than creating another revision or returning a false conflict.

## Remote metadata history

The file-backed adapter keeps a bounded metadata history for recent commits.

Each history entry contains information such as:

- revision
- server commit time
- client ID
- package creation time
- schema/release version
- record count
- manifest fingerprint
- package fingerprint

It does not duplicate every historical training snapshot.

This metadata exists for auditing and debugging; it is not a rollback implementation.

## HTTP endpoints

All sync endpoints are account-scoped and require an authenticated Loadnote session.

### GET /api/sync/status

Returns lightweight remote metadata only.

It does not return the full training package.

Useful fields include:

- whether a snapshot exists
- current revision
- updated time
- record count
- package/manifest fingerprints
- recent revision metadata

The consumer Account panel uses this endpoint only to show status.

### GET /api/sync/state

Returns the current verified remote package plus its revision.

Reading this endpoint does **not** import or apply the package to local training data.

The browser client verifies the returned package again before exposing it to future sync logic.

### PUT /api/sync/state

Stores a new snapshot if:

- the session is authenticated
- cookie-based requests pass CSRF validation
- the JSON request is within the configured size limit
- the package passes sync verification
- `expectedRevision` matches the current remote revision

A stale different package receives HTTP 409.

An invalid package receives HTTP 400.

## Request-size boundary

Structured training snapshots can be much larger than ordinary Coach/account requests.

v2.58 therefore gives the sync endpoint a separate bounded body limit.

Default:

`8 MiB`

Configurable with:

`LOADNOTE_SYNC_MAX_BYTES`

The server hard-caps this at 32 MiB.

Progress photos remain excluded from this protocol partly so binary media cannot accidentally inflate structured sync requests.

## File-backed storage adapter

The first implementation stores one current package file per account under:

`LOADNOTE_SYNC_STORE_PATH`

In development, the default is:

`.loadnote-data/training`

In production, remote training storage remains disabled unless an explicit persistent path is configured.

Writes use temporary-file replacement and restrictive file permissions where supported.

### Scaling boundary

Like the v2.57 account store, this is a **single-process / single-instance foundation**.

It is not a substitute for transactional database/object-storage infrastructure.

Before Loadnote runs multiple API instances that can write the same accounts, replace this adapter with a transactional implementation that preserves the same semantics:

- account scoping
- verified package storage
- monotonic revision
- compare-and-swap commit
- idempotent retry
- integrity validation

Do not place the file directory on a shared filesystem and assume that creates safe multi-instance concurrency.

## At-rest security

v2.58 does not add application-level encryption of snapshot files.

A production deployment using this adapter should rely on appropriately secured persistent storage, host access controls, encrypted disks/volumes where appropriate, secret management, backups, and restricted operator access.

A future production database/object store should follow the same principle.

## Browser client

`src/product/remote-sync.js` provides explicit primitives for later sync work:

- stable non-secret client ID
- lightweight remote status
- verified remote snapshot fetch
- local package preparation
- explicit revision-checked upload
- local receipt metadata after a confirmed upload

These helpers do not automatically run uploads.

A fetched remote package is never automatically written into local training history.

An upload packages the current state but does not mutate that state.

## Consumer UI

The Account section now shows remote storage status when signed in.

It can show:

- storage not configured
- storage ready but empty
- current remote revision / record count / saved time

Beginning in v2.59, the Account section exposes **Sync now**. Safe one-sided changes can merge automatically; divergent same-record changes require explicit device/cloud choices. A device without a trustworthy shared base must choose a whole starting copy instead of guessing. Sync is still user-initiated; there is no background synchronization.

## Relationship to synchronization

v2.59 implements the following explicit/manual flow on top of the v2.58 storage boundary:

1. authenticate account
2. read remote revision/status
3. compare the device's last acknowledged base to the current remote revision
4. package current local structured training data
5. fetch the remote package when needed
6. use the v2.55 three-way merge model
7. stop for explicit conflicts
8. validate the merged relationship graph
9. commit with `expectedRevision`
10. only after server confirmation, persist the new shared base/revision locally

v2.59 performs these steps only after the athlete chooses **Sync now**. Background synchronization remains a later milestone.

## Still not completed after v2.59

This release does not implement:

- background/automatic upload and download
- cloud progress-photo storage
- background sync
- remote deletion workflow
- historical remote snapshot rollback
- multi-instance transactional storage
- subscriptions or billing

The important guarantee is narrower:

> Loadnote can now persist a verified, account-scoped structured-training snapshot behind a monotonic revision without silently overwriting a newer remote state.
