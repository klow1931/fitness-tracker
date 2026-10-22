# Loadnote v3.86.0 — Better Offline Coach Conversation

The offline Coach handles natural progress wording, a bounded set of common lift-name misspellings, and explicitly named follow-ups. Example: “How's my squats doing?” followed by “And my bench?” Each result is still computed by the existing validated training evidence engine, not by guessed context or a language model.

When the previous user question concerns a verified, athlete-approved adjustment, “Did that help?” becomes a request to inspect the exact saved follow-up outcome. It never interprets an assistant's previous text as evidence of progress or approval.

Context reads at most eight recent message rows, is limited to the athlete's questions, and resets on unrelated or symptom-related turns. Ambiguous movement references remain unanswered rather than guessed. Original full text is screened for medical/urgent risk before any normalization. No workout log edits, new doses, or account memory are involved; internal kg, RPE and schema 34 stay unchanged.

The v3.85 post-merge CI smoke failure was a GitHub Ubuntu apt 403 from a Microsoft package mirror during Chromium dependency provisioning. The smoke job now uses the same pinned Playwright container already used by browser shards and WebKit. Node, browser, security, native and beta gates remain required.

New tests: tests/coach-language.test.js and tests/browser/coach-v386.spec.js. Release 3.86.0 and unsigned native beta 34600. Preserve v3.85 as rollback pending CI, mobile offline and athlete acceptance.
