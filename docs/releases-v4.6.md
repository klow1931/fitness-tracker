# Loadnote v4.6.0 — Local Coach runtime foundation

The optional local model now runs in a dedicated worker using a pinned, same-origin WebLLM bundle. Model files still require explicit download consent. Built-in coaching and reviewed programming remain available without downloading a model or exposing WebGPU.

- Cancel an in-progress load or turn the model off without waiting for a download to finish. Load, device-check and reply timeouts release the worker. Private conversation selection survives a failure, preventing online fallback.
- Test a fresh offline start: the active worker is terminated and a new worker loads the selected model with its fetch implementation restricted to browser-cache hits. Only successful initialization and both explanation probes mark that test as passed. This is a session-specific cache usability check, not a hardware, accuracy or future cache-retention guarantee.
- Remove the selected model's cached weights, tokenizer, configuration and compiled library through WebLLM's scoped deletion API. App caches and training records are not cleared. A compiled library shared by another model may need downloading again. Partial failed deletion is reported and can be retried by inspecting and choosing the model again.
- When deterministic Coach has no answer, an opted-in ready model may select a permitted read-only/review-only tool. Exact JSON validation rejects unknown tools and all extra arguments. Original athlete text goes to existing plan, exercise-history, coaching-reference or program-request validation. The model cannot invent request parameters, save a program or schedule training.
- Requests intentionally kept in deterministic coaching no longer falsely label a healthy local model unavailable.

The runtime build and license are reproduced from the exact npm lockfile during packaging. Model weights are excluded from app-shell precaching. Runtime manifest includes its version, byte count and SHA-256 for build inspection; this is not model-weight integrity certification.

Version **4.6.0**, native development build **36600**, schema **34** unchanged.

Validation covers lifecycle and failure paths with deterministic model doubles, actual browser worker behavior and network blocking, runtime import, existing offline conversation and planner checks. Real model accuracy, GPU performance, battery usage and iPhone compatibility require compatible-device testing with actual model weights. No model weights were downloaded for these automated checks.

Later milestones: measured model-quality evaluation on athlete scenarios; a reviewed offline knowledge corpus and semantic retrieval; richer tool-request understanding that preserves original athlete facts; only then consider model adaptation using licensed, consented, de-identified examples.
