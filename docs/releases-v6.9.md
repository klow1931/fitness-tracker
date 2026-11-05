# Loadnote v6.9.0 — Clearer Coach and workout continuity

Version 6.9.0 · unsigned native build 38900 · training schema 34 unchanged.

## Behavior

Coach checks actual server availability before presenting an account action. Offline guidance remains available for anonymous athletes, disconnected sessions and the native local-only beta. A configured server still requires explicit Online chat selection; these presentation changes never enable cloud conversation or send training data. Late availability results cannot overwrite a newer refresh, offline event or local-conversation selection.

Full Coach reuses the same context-aware question selection as quick Coach, including current-set, checked-set comparison and rest questions. The eleven existing educational shortcuts remain under More topics. Optional welcome choices stay on Home instead of interrupting other destinations; native safety notices remain global. Polling preserves shortcut nodes while the questions remain unchanged.

An unfinished logger gets a Return to workout action. It opens the existing logger through the established fast-start route, without filling targets, completing sets, changing workout dates/units, clearing edits or committing history. Failed/degraded checkpoint text remains honest; this action does not claim a failed draft is saved. The return action hides when the draft has been cleared or committed.

Research & saved sources now has an explicit Back to conversation action when opened from either Coach surface. It restores the originating conversation; closing cancels pending research through the existing permission/revision boundary. Searches, excerpts, local saved references and training data retain their existing contracts.

## Architecture

`coach-workspace.js` is deterministic, read-only presentation policy. `coach-workspace-ui.js` coordinates availability and workout continuity. The previous connection renderer in app.js delegates to it. Question selection stays owned by Coach Companion; no duplicate intent engine is introduced. Both new modules ship in the PWA cache and native bundle.

No data migration is needed. Version/cache/native metadata are aligned. Merged v6.8 commit `0de7ecc` remains the rollback baseline on main while this release is validated separately.

## Validation and limits

Run the complete Node/syntax suites and mobile/native/beta checks. Chromium and iPhone WebKit coverage includes availability/sign-in combinations, stale responses, local-only/offline behavior, current question consistency, failed checkpoint messaging, kg/lb and past-dated draft return, cleared drafts, research return, and narrow/enlarged text.

Native builds remain unsigned and local-only. Physical-phone acceptance, signing and commercial readiness remain separate gates. This release adds no model download or hosted AI service.
