# Training Block Context (schema 11)

This is context infrastructure, not the v2 Decision Engine. Existing workouts, drafts, PR reconciliation and core RPE-aware estimates retain their formats and behavior.

## Storage and dates

`trainingBlocks` is an independent collection. Each record has a stable UUID, ISO UTC `createdAt`/`updatedAt`, and ordered `revisions`. Each revision has a `recordedAt` timestamp and a complete context snapshot, or `context: null` for deletion. Deletion removes current association/UI visibility but preserves audit history in JSON backups. It is not permanent erasure of notes.

Context contains name, inclusive start/end calendar dates, extensible block-type string ID, goal, structured load strategy, progression intent/notes, optional notes, training maxes and known/recent 1RMs. Each benchmark stores an exercise name, positive kg value and `observedOn` calendar date. UI captures units when opening an editor and converts only at that boundary. Benchmarks are never used as estimated capacity.

Block overlaps are rejected, including shared boundary days. An open end extends indefinitely. Close the earlier range before adding a sequential block. Validation checks each revision-time snapshot too, so imported histories cannot create ambiguous historical precedence. Unknown future block-type IDs are preserved; unknown strategy/intent IDs are rejected until explicitly supported.

## APIs

`LoadnoteBlocks.upsert(records, context, {id?, now?})` and `remove(records, id, now?)` return validated new collections. They do not change workouts. UI commits through the existing persistence writer before exposing a mutation. `validate(records)` validates and normalizes full backup records before import confirmation/replacement. Backups without blocks migrate to an empty collection.

`at(records, workoutDate, {knownAt?, retrospective?})` resolves context without storing anything on the workout. By default only revisions recorded on or before that date are available; an explicit earlier timestamp narrows the cutoff. Benchmark known-on dates are also filtered. Use it for each workout when building chronological analysis.

`analyze(records, workouts, blockId, {asOf, knownAt?, retrospective?})` requires an explicit date, excludes all workouts later than that date or outside the selected range, and uses metadata available by the cutoff. `retrospective: true` opts into today's corrected/backfilled context; the result and UI label it explicitly. Historical context entered today is NOT silently treated as information recorded months ago. This conservative default can omit legitimately known but unrecorded context; retrospective analysis is available separately.

Workout records have not historically retained revision/entry timestamps. These APIs prevent future workout dates and later block revisions from leaking into earlier analysis, but cannot reconstruct what an edited historical workout looked like before its edit. A strict future backtester must add workout revisions/provenance before claiming full point-in-time replay.

## Metrics and interpretation

Block summaries provide workout count, training days, elapsed duration through the cutoff, logged volume, average RPE and frequency when at least a week is observable. A zero workout count is real; unavailable performance data is null.

Per-exercise logged-load trends use best logged load per date. Estimated-capacity trends use the existing core RPE-aware estimator on positive loads, 1–12 reps and RPE 6–10, with at least three distinct days. Estimates are demonstrated-performance proxies, not measured physiological strength. Partial/missing RPE cannot become an invented estimate. Neither known 1RMs nor training maxes fill gaps. Same-load/different-effort and same-effort/increasing-load cases remain distinct.

The current workout schema does not reliably retain prescribed loads or planned block sessions. Prescription trends, adherence, completion, prescribed intensity and block PR counts remain null rather than guessed. Logged-load trends are never labeled prescription or strength gains. Conservative/re-entry/ramp context explicitly cautions against equating load increases with capacity gains.

## Acceptance

Node tests cover CRUD/revisions, sequential ranges and overlap rejection, date association, future cutoffs, partial context, migration, benchmark distinction, sparse and RPE-aware performance. Desktop/mobile Chromium tests cover offline editing/reload with an unfinished workout, lb roundtrips, deletion without losing workouts, backup/import, overlap errors and failed writes. Existing v1.9 offline/update tests remain part of the full suite. Physical iPhone testing remains a separate manual check.

For the returning-powerlifter scenario, enter real historical workouts, then create a return/re-entry block with conservative loading and return-ramp intent. Use real benchmark known-on dates. Do not insert synthetic progress or automatically infer that training-weight progression equals strength gain.
