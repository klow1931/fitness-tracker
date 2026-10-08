# Loadnote v3.16.0 — Accessory follow-ups

Open **Decisions → Training context & edits → Accessory follow-ups**, or ask Companion “How did my accessory change work for Chest-supported Row?” The same read-only review shows **previous target → approved target → recorded performance**. A labelled movement selector filters the history; evidence and next steps remain expandable on mobile.

## What the recap establishes

Only existing accessory-review Calendar revisions with one verifiable accessory load change are included. The approved movement, load convention, sets, rep range and effort cap must match a reviewed accumulation or strength source. Results require one uniquely linked workout for that exact revision and date, a matching before-training prescription, matching movement identity, set count and load, and valid actual reps and effort for every set.

Matched performance is reported as within range, top of range, below range, outside the rep range or above the effort cap. Missing or invalid effort remains unknown. Changed loads, prescriptions, identities, dates or links, duplicate workouts and missing source records need review rather than being counted as success. A future exposure is scheduled; a past exposure without its log has no assumed completion. Skipped, cancelled and superseded targets are explicit. A later Calendar revision does not erase a workout matched to its own earlier approval.

The recap uses current corrected records available at the review time. Correcting a saved log refreshes the result. It is not a frozen historical replay, proof of recovery or evidence that an adjustment caused an outcome. Actual equipment is not independently remeasured. One exposure does not authorize another increase, and the next scheduled target remains intact. The existing explicit accessory review is available for a subsequent decision.

## Persistence and accessibility

Follow-ups never write targets, logs or new records. They read existing Calendar revision history and linked workouts; schema **32** is unchanged. Companion keeps this answer local even in a signed-in session, and health questions retain the existing health routing. Native labelled selects, semantic headings and definition lists, expandable evidence, keyboard dismissal and the existing modal focus handling are retained. Uniform sets are summarized once rather than repeated.

## Validation

Unit checks cover exact revisions, changed/missing/duplicate logs, effort and rep boundaries, corrections, review-time visibility, later revisions, source validation, pounds display and read-only Companion routing. Browser checks cover 320-pixel light/dark layouts, labelled controls, local signed-in recap routing, corrections across reload, missing and changed work, ambiguous evidence and empty history. CI runs the full desktop/mobile browser suite and native package checks. Physical iPhone and VoiceOver acceptance remain manual.

Version **3.16.0**, native build **31600**; schema **32** unchanged.
