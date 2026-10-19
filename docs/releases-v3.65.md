# Loadnote v3.65.0 — Safer Custom Program Editing

Athlete-written and imported custom programs remain private, local-first and review-driven. Version 3.65 makes it easier to finish revisions and safely adopt them without overwriting training history.

## Unfinished drafts and Undo

Custom Program Studio saves the current editor rows, source description, configuration and optional edit reasons in this browser as work changes. Closing the editor retains the draft. **Resume unfinished draft** restores it; **Discard draft** removes it. The **Undo last edit** button restores recent input or row-operation snapshots, up to 20. Drafts expire after 30 days and are bounded to 1 MB and 1,500 rows. They are not included in account sync or automatic backups until the program is explicitly saved. Anyone using the same browser profile may be able to access a draft. Original file bytes are not stored.

## Annotate individual movements

When editing a copy, the usual overall reason remains required. Movement changes in the review can optionally receive their own reason category and short explanation, such as *equipment access* for a substitution or *recovery* for lower volume. Saved rationale is auditable in the revision. Coach may refer to an overall **or** movement-specific rationale only when the athlete checks the consent box. Consent does not let Coach change prescriptions or establish cause and effect.

## Apply edited copies to future Calendar sessions

An edited, reviewed copy of an already scheduled custom program offers **Apply edits to future Calendar**. A date-by-date confirmation shows original future sessions to cancel and new edited sessions to schedule. The safeguard:

- Does not touch today, the past, logged workouts or completed/skipped sessions.
- Refuses conflicting scheduled dates and future original sessions with linked workouts.
- Refuses a stale review, an already superseded parent, or an active workout draft.
- Preserves the original reviewed program, historic Calendar revisions and workouts. Future cancellations append revisions rather than deleting prior targets.
- Marks the parent as superseded so the new edited plan becomes the current custom program. Evidence summaries use actual scheduled dates rather than treating unscheduled historic weeks of the new copy as missed sessions.

Scheduling a reviewed copy separately is still possible when Calendar dates do not conflict. Neither action automatically adjusts weights or training based on imported files.

Schema remains 33; native build number 33409. Browser, model and release checks supplement but do not replace real-device testing, athlete acceptance or App Store/Play Store signing and review. Scanned-PDF OCR and arbitrary program-language execution remain out of scope.
