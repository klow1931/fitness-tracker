# Loadnote v3.7.0 — Clear coaching and reversible completion

Based on merged v3.6.0. Coach opens with Today, Your program and Ask Coach. Goals and Insights remain reachable under More; existing program review and deep links retain their original panel and handlers. Today reuses the current lifecycle next action, not a new recommendation engine.

Quick RPE/Done completion offers one session-local undo in the cockpit. It restores the previous RPE and unchecks the latest completed set while keeping entered reps/load. It refuses after edits to that set, unit/date/name changes, replacement of the form, or save. Undo survives neither reload nor a new completion. Rest is restored with its original deadline only if no subsequent timer action changed it; independently edited timers are left alone. Existing voice undo and historical revisions remain separate. Local draft save failure remains visible after undo.

Proposal previews show current and proposed future targets side by side. Evidence lives under Why? Explicit confirmation, decline-by-default, stale proposal validation, draft guards and persistence-before-apply remain unchanged. Chat still cannot approve changes.

After acknowledged workout persistence, the recap leads with Logged / Watch / Next. It summarizes actual recorded strength sets and missing RPE without inventing recovery or strength gain. Detailed set comparisons are retained under Session details; existing continuity and review actions stay available. It is not a personalized physiological assessment.

No schema migration, new telemetry, cloud sync or programming algorithm change. Version 3.7.0/build 30700. Browser coverage includes primary/secondary navigation, guarded undo, rest restoration, reload, reviewed save and exact proposal display. CI screenshots are saved in training-loop-demo. Browser tests are not proof of physical keyboard behavior or human logging speed. iPhone Safari/app, background/resume, storage failure, export/restore and real-workout acceptance remain required. Merged v3.6 is the rollback baseline.

During execution, secondary quick controls remain inline in the workout card so they cannot cover set-entry buttons. An unusually tall cockpit also returns to normal flow rather than consuming the phone's usable viewport. Outside execution, the original dock behavior remains available.
