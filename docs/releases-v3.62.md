# Loadnote v3.62.0 — Athlete Trust & Coaching Intelligence

**Status: development candidate, not signed or pilot-approved.** This is one focused follow-up to merged v3.61. The schema remains 32, internal loads remain kg, and native build advances to 33406.

## Storage trust and privacy-safe diagnostics

- Tools → Backups & data → Save diagnostics for beta testing shows the current release, web/iOS/Android platform, actual storage backend, latest save result, last successful save *in the current app session*, and a bounded error category (`storage-full`, `permission`, `transaction` or `storage-error`).
- All diagnostic values are whitelisted: workout content, names, measurements, account identifiers, original exception messages, and private exports never enter the receipt. Copy requires a deliberate tap and uses the device clipboard; no telemetry or upload is added.
- A successful IndexedDB write is distinguishable from a committed localStorage fallback. The user sees that fallback is active and should export an external backup. Failed writes remain visible with a retry path.
- Web JSON export now says the download **started**, not that the destination file was verified. Native share-sheet and existing fingerprint import review still require deliberate destination inspection. No automatic backup-completion claim is added.
- The separate **Check saved backup file** control reopens a selected JSON file without importing or replacing data. It checks basic structure and the existing manifest fingerprint, reports counts/units and explicitly distinguishes legacy files without fingerprints. Restore compatibility still requires the import preflight.

## Offline Coach corrections and clarification

- Multi-turn requests can revise days, minutes and equipment: “Instead of 4 days use 3 days”, “Not 60 minutes, 45 minutes”, and “Also add dumbbells”.
- “3 or 4 days” or “45 or 60 minutes” clears the disputed field and asks a specific question. Existing valid details remain for the next turn.
- “Make it a normal strength program rather than meet prep” withdraws meet status **without shortening the originally requested weeks**. Unsupported standalone long blocks remain blocked with the existing meet-plan clarification.
- No chat write, medical advice, inferred load, background internet learning or unrestricted general-purpose LLM is introduced.

## Planned versus actual without invented progress

- Progress → Training Review shows a 7- or 28-day observational comparison of saved strength work versus current-corrected logged sets.
- Comparable rows require a verifiable before-training prescription and one-to-one exercise identities, matching set counts/load conventions, load and rep targets and actual RPE against the cap. Changed exercises/sets, missing RPE, after-the-fact plans and unplanned sessions remain visibly **unknown or different**, not silently counted as good or bad adherence.
- Ask offline Coach “Compare planned versus actual” or “Did I follow my workout plan?” to get a grounded, read-only explanation with a link to inspect Training Review.
- This report does **not** prescribe new weight, change Calendar, backfill RPE, conclude strength gains, or attribute causes. Existing Decisions review/approval workflows control future target changes.

## Required acceptance after automated checks

1. On a disposable Android emulator and physical iPhone PWA, log offline sets, interrupt/restart, verify latest result and export JSON; inspect the *saved* file's manifest through Import review and Cancel.
2. Simulate IndexedDB failure and observe localStorage fallback and the truthful warning. Simulate fallback quota/permission failure and verify the retry banner and metadata-only report.
3. Ask the Coach for a 20-week meet prep, then revise frequency, minutes and equipment in multiple turns; deliberately supply ambiguous alternatives and confirm it asks rather than choosing.
4. Compare identical, above-cap, missing-RPE, substituted and retrospective workout cases in both Coach and Progress; verify no writes or automatic next-week load changes.
5. Run the [v3.61 physical-device and consenting-athlete pilot](v3.61-athlete-pilot.md) on the exact tested build with no unresolved critical loss/privacy/safety defects. Physical-device, external-file, Google Play signing and store review remain pending until independently documented.
