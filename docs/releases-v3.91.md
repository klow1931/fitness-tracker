# Loadnote v3.91.0 — Two-Lift Training Trend Conversations

The offline Coach can compare **two explicitly named competition lifts** from their saved training: “Compare my squat and bench progress,” “Compare my bench vs deadlift trends,” “What about bench and deadlift?”, and “What's missing for those two lifts?”

Each lift is inspected independently using the existing ProgressStory-backed 12-week comparison. Answers present earlier and recent RPE-aware training days and each movement's own relative capacity trend if supported. The Coach never compares squat kilograms directly to bench kilograms, claims a tested maximum, declares physiological causality, or silently changes a program.

Only recent athlete questions supply a comparison pair; unrelated questions or symptom reports reset the context. Missing data, unmapped lifts, and unclear selections remain visible rather than fabricated. No storage migration or new fatigue model is needed.

Architecture: a focused coach-lift-comparison.js module wired into the established conversation router. Tests: tests/coach-lift-comparison.test.js, tests/browser/coach-v391.spec.js, plus all static, Node, security, Chromium, WebKit and native checks.

Release 3.91.0; unsigned mobile beta 35100; schema 34 unchanged. Preserve v3.90 as the known-good rollback until complete validation.
