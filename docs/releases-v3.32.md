# Loadnote v3.32.0 — Explicit optional device-model selection

The local-first Coach remains the default, including verified performance, programming reviews and history explanations. A separate, experimental downloaded language model is **optional**.

## Changes
- From Coach → Coaching references → Local AI, choose **Check compatible models** before downloading weights. This loads the approved WebLLM runtime code when required and inspects compatible instruction models; it does not initialize a model engine or fetch model weights.
- The preview shows specific runtime-provided model identifiers and their **estimated GPU memory**, not claimed storage/download size, measured performance or quality.
- Automatic selection remains the default. Users may instead choose an explicitly listed compatible model and separately approve model download and the existing two device explanation checks.
- Compatibility filters keep models at or under 1,400 MB runtime-estimated GPU memory; they enforce WebGPU feature and buffer requirements when available. Unlisted model IDs or incompatible selections are rejected.
- When unavailable, the UI explains the problem and built-in Coach continues. The WebLLM browser runtime may cache model artifacts, but Loadnote does not promise that an entire model is cached or usable offline. The runtime's WebGPU and storage behavior determines feasibility.
- Nothing about exercise log history, training data schema (32), RPE, training-maxes, kg/lb units or approved program targets changes. Optional model text cannot override existing deterministic evidence from v3.31.

## Validation
- New isolated unit tests ensure preview never initializes/downloads a model, explicit selection is validated against the runtime list, incompatible IDs fail, consent remains mandatory, and disabling leaves the model off.
- Browser coverage checks rendered choices and the separate download action.
- Run complete unit/syntax, Chromium/mobile WebKit, Android beta, native build and package CI before merge; device-level compatibility checks need physical testing.

## Technical
WebLLM 0.2.85 exposes prebuilt model records with GPU estimates and feature requirements. The app's normal app shell caches only Loadnote code; downloaded runtime and optional model artifacts use upstream/browser storage and are not bundled into the app. No third-party endpoint is used to answer Coach queries while private on-device conversation is selected.
