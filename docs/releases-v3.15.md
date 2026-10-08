# Loadnote v3.15.0 — Review the next accessory target

In Decisions, open **Training context & edits → Review accessory targets**. Companion can open the same review when asked “What should I do next time for Chest-supported Row?” Chat reads the evidence; approval happens in the review dialog.

The review shows a compact **next planned / last recorded / reason** summary. Expand **Evidence & limits** for the two latest planned exposures, their linked prescriptions and actual logs. Multiple movements produce a choice rather than an inferred selection.

## What supports a change

- A saved, scheduled phase program or meet cycle identifies the exact accessory slot, equipment, rep range, set count and effort cap. Only accumulation and strength sessions are eligible.
- The two consecutive planned exposures must be on distinct dates. Each needs one dated, uniquely linked log, an exact before-training prescription, the same movement identity/name, tracking, load, set count and rep range as the future target, and valid actual effort for every set. Missing or changed work cannot be skipped in favor of older successful logs.
- If both exposures reach the top of the range within the effort cap, a load increase can be reviewed. If either matched exposure exceeds the cap, a smaller load can be reviewed. Other matching work keeps its target.
- The athlete enters a usable load in the reviewed direction, within 5% of the scheduled load. This bound and the two-exposure rule are conservative software policies, not individually validated doses or proof of recovery/strength gain. No numerical load is prefilled.
- Approval requires confirmation of the same actual equipment/setup, a compatible load convention, no current symptoms or restrictions affecting the movement, and the exact before/after change. Legacy logs lack equipment/convention provenance; the comparison is athlete-confirmed, not independently measured.

## Scope and persistence

One unperformed **future** Calendar session changes. Reps, sets and effort caps, all other exercises, later sessions, source programs, training maxes and completed logs remain intact. The existing Calendar revision stores the approved load/convention, confirmation statement and linked log IDs. This uses schema 32; no new record collection or migration is required.

Current corrected records are reviewed by workout date and current knowledge time, including local evening logs created after UTC midnight. This is not a frozen historical evidence replay. The original logs and source programs remain available; corrections can change subsequent review findings.

Holds, conditioning, zero added-load progression, protected phases, rescheduled or manually edited targets, ambiguous identities, changed loads, incomplete effort and current intake concerns require separate manual review. A change to one session is not permission to copy the new load throughout the cycle. Existing phase/cycle reviews continue to protect revised Calendar sessions rather than overwriting them.

Approval recomputes the evidence and target. Changed profiles, logs or Calendar revisions invalidate the preview. Display-unit changes and open workout/sport drafts block approval. Failed durable saves preserve the prior in-memory state; successful revisions persist through reload.

## Validation

Unit coverage exercises matching/changed/missing logs, effort caps, bounded load directions, stale previews, exact identity, meet-cycle targets, one-session isolation and read-only Companion answers. Desktop/mobile browser coverage checks compact light/dark layouts at 320 pixels, labelled controls, local signed-in routing, confirmation, persistence, storage failures, pounds conversion and draft/unit guards. CI also runs the full browser suite and native packaging checks. Physical iPhone and VoiceOver acceptance remain manual.

Version **3.15.0**, native build **31500**; schema **32** unchanged.
