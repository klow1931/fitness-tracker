# Loadnote v7.12.1 — Readable narrow workout inputs

Version 7.12.1 · unsigned native build 40201 · schema 34.

At widths up to 360px, workout rows stack reps or duration, load and RPE into separate full-width fields. This gives three-digit decimal loads room at enlarged text sizes. Completion and remove-set controls remain alongside the numeric fields.

The change extends the existing logger CSS. Existing workout storage, unit conversion, RPE and training calculations continue through their current engines. No migration is required. The rollback baseline is approved main 40a16f42a97af91c441e9fcd87d5e60a92dd63f3, v7.12.0/build40200.

Regression coverage uses synthetic completed and unfinished sets at 320px with 20px root text, kg/lb and Gym mode on/off. It measures rendered numeric text against available input space, checks touch height and overflow, then reviews, saves and reloads exact loads, reps, RPE and one workout. Existing Coach-return draft recovery and all release/offline journeys remain required.

Validation is pending complete Node/static/package/native-source/beta/release checks and CI browser/native/emulator/security gates. The local browser runner requires the pinned Playwright executables. Record actual results in tracker #278 and the improvement PR before marking ready. Physical-device acceptance remains outstanding.
