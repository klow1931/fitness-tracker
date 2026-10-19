# Loadnote v3.64.0 — Explainable Program Edits

Loadnote now retains both **what** you changed in an athlete-authored program and, if you choose to record it, **why**. This is a reviewable, private-by-default record, not automatic adaptation or AI model training.

## How to use it

1. Go to **Coach → Programs → Custom Program Studio** and expand a saved plan.
2. Choose **Copy to edit**. The original and all already scheduled workouts remain unchanged.
3. Change any exercises, sets, reps, loads, rest, RPE, cardio minutes, notes, week/day mapping or program details.
4. Choose **Preview program and conflicts**. Loadnote lists what differs from the original, with a total change count and the first 25 examples if the list is longer.
5. Choose why you edited it: recovery/fatigue, performance, time/scheduling, equipment/access, personal preference, coaching review, or Other. You can add a short explanation (required for Other).
6. Optionally check **Let Coach use my reason**. If unchecked, Coach may still discuss the exact saved target differences but must say the *reason* is private. The reason remains visible to you under the saved copy's **Review changes and your reason** section.
7. Confirm the complete program and **Save reviewed program**. Schedule the new copy separately only after you want to use its sessions.

Ask **“Why did I change my program?”** or **“What have you learned from my uploaded program?”**. Coach distinguishes the objective saved edit (e.g. three sets instead of five) from the athlete-reported explanation (e.g. the fifth set felt too fatiguing), and never claims it proves a medical cause or a programming benefit.

## Data and privacy

- The original saved program is immutable; a new copy links to its parent by ID, preserves a bounded difference summary and the explicitly entered reason.
- All details remain on the device unless you choose to back up or sync your Loadnote data. Program reasons are part of those saved records. The import file itself is still parsed locally and is not retained.
- Giving Coach permission to discuss a reason also permits the opted-in on-device model to receive the selected program's bounded reason when that program is active. Without permission, its text and category are excluded from that model context.
- No reason automatically edits training, approves scheduling, diagnoses injuries or trains a remote model. Coach answers from saved data and still requires athlete review for prescriptions.
- Existing v3.63 saved programs remain valid without a revision field. Storage schema remains **33**; web/native release **3.64.0**, native build **33408**.

## Limitations and verification

- Changes are matched by week, weekday, exercise name and type. Renaming, moving or changing an exercise's type is shown as a removal and addition. Duplicate identical exercise rows are compared in their recorded order.
- Only 25 per-copy change summaries are stored; the total count is retained. Longer training notes are flagged as edited without copying their free text into the difference summary.
- Tests cover edit comparisons, privacy consent, original preservation, data validation, backups/sync and Coach responses, plus an end-to-end browser scenario. Real devices and varied third-party program file layouts still need athlete acceptance.
