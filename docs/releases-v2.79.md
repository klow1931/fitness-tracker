# Loadnote v2.79.0 — Coach Companion Foundation

## Summary

v2.79 makes Coach available as a persistent companion across Loadnote and gives it bounded awareness of the workout currently being performed.

## Added

- persistent Coach Companion launcher across primary Loadnote surfaces
- compact companion conversation panel that follows navigation
- live active-workout context: current exercise/set, entered work, target/previous text, workout position and rest state
- explicit `weightKg` plus separate display weight/unit in live context
- offline deterministic answers for current-set and rest-time questions
- reversible local rest-timer commands
- authenticated online Coach support for bounded `companion` context
- server prompt guardrails preventing the AI layer from claiming it performed training mutations
- app-shell caching for companion modules

## Preserved

- Decisions remains authoritative for training changes
- existing workout logger remains authoritative for saved performance
- existing secure server-side Coach provider boundary
- existing Coach tab and built-in offline guidance
- existing kg/lb conversion and storage rules
- schema v25

## Deliberately not included yet

- realtime microphone/audio sessions
- always-listening or wake-word behavior
- voice logging
- automatic set completion
- direct AI workout/program mutations
- background coaching while the native app is closed

These are intended to build on the v2.79 companion boundary rather than create a separate coaching system.
