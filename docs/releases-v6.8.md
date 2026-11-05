# Loadnote v6.8.0 — Mobile training and conversational research

Version 6.8.0 · unsigned native build 38800 · training schema 34 unchanged.

## Changes

- Keep the same Coach launcher and conversation, but place its button within workout controls while Train is open. It no longer floats over numeric set fields. On mobile it joins the existing quick-control dock when that dock is visible.
- Show all nine quick RPE choices (6–10 in half steps) in a wrapping grid on mobile, with 44px minimum targets and no horizontal swipe. Completion, draft checkpoints, undo, performed-load validation, and unit conversion retain their existing engines.
- Collapse secondary Coach controls into **Coach options** in both conversation views. Keep voice start/stop accessible while moving cue preferences into options. Model download/testing controls require an explicit `?developer=1` view; normal Coach does not advertise experimental downloads.
- A supported-topic research button beneath a Coach answer now performs an explicitly approved keyword search **inside that conversation**. Both conversation views show the same results, expandable dated citations/excerpts, cancellation, errors/retry, and explicit offline save. Personal messages and training data remain excluded from the search query. No generated synthesis of arbitrary papers or automatic programming changes are introduced.
- **Research & saved sources** remains available through Coach options for manual topics, permissions, offline sources, and clearing saved references. Saving updates an open library immediately and changes the save button to **Saved on this device**.
- Explain general training-volume questions before requesting personalized workload setup. Personalized and symptom-related questions retain existing evidence and safety routes.
- Reduce mobile branding/introductory card height and simplify the Home view-preference banner. Use visible Coach → Your program terminology in updated conversation routes.

## Architecture and data

Existing research transport, normalization, permission modes, topic allowlist, and saved-reference storage are reused. Rendering creates text nodes, preserving source sanitization. Inline search is bounded by the research revision and conversation lifetime; clearing a conversation cancels pending research. Cached citations remain device-only, outside training sync/backups. Reviewed local explanations remain separate from externally retrieved abstract excerpts.

No workout schema, storage-unit, or migration changes. The merged v6.7 commit `d73d783703a9b4a3cc9db36b2a645fa2dfbc4c00` remains the rollback baseline; this release is prepared on a separate branch.

## Validation

Run the complete Node and syntax suites, full Chromium browser suite, targeted WebKit suite where supported, mobile packaging and native consistency checks. New regressions cover inline research permission/privacy, cancellation and retry, saved-list feedback, conversation options, unobstructed workout access, all RPE choices, and general versus personalized volume explanations.

Browser emulation does not establish physical iPhone/Android keyboard, microphone, haptic, or store readiness. Hosted broad conversation still requires a configured secure backend. Native beta remains unsigned and local-only.
