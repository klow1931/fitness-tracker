# Loadnote v7.9.0 — A focused Home for training

Version7.9.0 · unsigned native build39900 · schema34.

Simple Home now contains useful training content rather than only suppressing advanced cards. Today's workout/unfinished draft stays first through the existing Today engine and guarded launchers. A small read-only card shows saved sessions dated in the last7 days, the latest saved workout, and direct History/Progress/Training calendar routes. Empty users get an explicit first-workout state. Future, empty, explicitly unfinished and duplicate-ID records do not inflate the summary. No new adherence, recovery or strength claim is inferred from attendance.

The pictured mode strip is now one native button: tapping either its current-mode label or its opposite-view action switches between Simple Home and Full Home. It remains available in both modes, states the current view and the action, shares the existing device-local preference with Profile/onboarding, and retains rollback if storage fails. Explicit hidden styling prevents mobile display:flex rules overriding hidden content. Existing automatic first-use onboarding routes remain available until a starting choice; explicit Simple selection still suppresses advanced Home cards. Full Home retains all original tools.

Architecture: simple-home.js is a read-only saved-history projection reusing progress/date utilities; simple-home-ui.js renders the compact card and delegates existing navigation. Today's draft/schedule/review gates, training engines, units, actual RPE, frozen prescriptions and saved history are unchanged. Same preference/storage shape; no migration. Two added modules are included in the offline asset manifest.

Validation: business tests cover date windows, future/empty/duplicate exclusion, correction and immutability. Browser journeys cover visible content and bidirectional switching, empty/saved/scheduled/draft states, lb/RPE reload recovery, safe navigation, failed storage and320px enlarged-text layout. Exact full Node/static/release/browser/native/emulator/security results are recorded in PR/tracker; no local browser result is invented for the known socketEPERM environment limit. Physical iPhone/VoiceOver and genuinely disconnected-live acceptance remain separate.

Rollback baseline: approved merged main e98eae0ea9052b60e1a0f2541fd38333080f97f8 (v7.8.1/build39801). Preserve backups and roll back the complete validated release if needed. No unmerged/failing publication or native distribution is authorized.
