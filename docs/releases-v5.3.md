# Loadnote v5.3.0 — Supportive conversation and workout context

This combines the proposed v5.1 supportive-dialogue, v5.2 communication-preference and v5.3 live-workout milestones. It builds on merged v5.0 and reuses its existing evidence and review engines.

## Conversation

A bounded session-only dialogue reads up to 24 recent message records, using athlete turns rather than assistant/model assertions. Short answers about equipment, confidence, people, training alone, energy and time can continue the question Coach asked. Corrections update the stated concern; unrelated topics, explicit resets and health/crisis boundaries stop old context reuse. Support does not diagnose readiness, verify a reported performance or save feelings as athlete facts. Existing deterministic evidence and training review remain authoritative.

Authored brief/detail responses keep supported guidance and offer one question at a time. Follow-up buttons open existing exercise guidance or session review; they do not apply training changes. The optional local model cannot replace these deterministic replies.

## Optional communication preferences

Reply preferences can be reviewed from Coach Companion or requested in conversation. Only an explicit Save stores versioned reply-length and encouragement enums on this device. Chat requests show a proposed review; they do not persist anything. Edit/remove are available in the same dialog, storage failures are visible, corrupt/unavailable storage uses defaults, and no chat, emotional reports or training data are stored in this preference key. These settings are separate from training backups and synchronization. Existing confirmed training preferences remain in their existing Profile workflow.

## During a workout

Short questions describe fresh current-set targets, checked/unchecked displayed strength sets and actual timer state. An open draft’s checked sets are never called saved history or proof of completion. Other work may require separate review. Stale-date drafts, missing targets and invalid counts remain explicit gaps. The return-to-workout action preserves the existing draft and timer. Missing live numeric fields remain missing; explicit zero remains valid. No new set, workout, load, RPE, training-max or progression writes are introduced.

## Failed checks

The merged v5.0 main CodeQL failures were rejected advanced uploads while GitHub default setup remained active. The advanced workflow now chooses compatible publication while retaining all five analyses and their SARIF artifacts. Default setup is not disabled. A token without administrator-read permission conservatively retains artifacts with an explicit warning; unexpected API failures still fail the check. Administrator configuration and successful Security UI publication remain separate verification. See [CodeQL setup](codeql-setup.md).

## Validation and limits

Unit and browser coverage exercises multi-turn corrections, user-only context, topic resets, safety precedence, preference consent/edit/removal/failure, live targets/counts/timer, draft/history integrity, and publication policy. Existing full checks, browser shards, selected iPhone WebKit, Android/iOS compilation and offline Android acceptance remain release gates. Physical phone and real-model quality testing are not established by deterministic tests.

Version **5.3.0**, unsigned development build **37300**, schema **34** unchanged. No training-data migration or new backend; merged v5.0 remains the rollback baseline until validation and review.
