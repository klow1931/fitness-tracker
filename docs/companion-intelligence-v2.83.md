# Loadnote v2.83 — Companion Intelligence

## Goal

v2.83 makes Coach Companion better at explaining the training Loadnote already understands.

The Companion now receives one bounded, deterministic, read-only intelligence snapshot built from the current workout draft, reviewed program state, saved training history, Progress Stories, set guidance, and accepted programming-review changes.

This keeps the product architecture clear:

**Decisions decides. Logger records. Companion explains.**

The language model does not become a second programming engine.

## Questions the snapshot is designed to support

Examples include:

- What phase am I in?
- What week of the program is this?
- Why am I doing this set or load?
- What should I focus on today?
- How is this movement trending?
- How is my training going?
- What changed recently?
- Why did Loadnote change this?

When evidence is missing, the correct behavior is to say that rather than infer a reason.

## Deterministic evidence sources

### Program lifecycle

Uses the existing Program Lifecycle engine to report:

- selected reviewed program
- week and total weeks
- current phase and phase week
- event / meet context when present
- scheduled-session outcomes
- next lifecycle action

Phase-purpose text describes the role of the phase. It does not create new programming policy.

### Session intent and prescription

Uses the active workout draft to report:

- session role
- stated session goal
- linked scheduled-session ID
- current planned exercise
- current planned set
- target RPE

Planned load remains kilograms internally.

### Set guidance

Uses the existing deterministic Set Guidance engine to compare completed work with the reviewed prescription. The Companion can therefore explain when logged actual RPE is above, below, or within the existing target without inventing a new progression decision.

Actual RPE and target RPE remain separate fields.

### Progress Stories

Uses the existing conservative Progress Stories engine over a 12-week evidence window to provide:

- strength direction
- consistency / adherence when scheduled evidence exists
- bounded milestones
- recent accepted programming changes
- current-movement evidence when available

These are descriptive training signals. They are not readiness or recovery scores and do not prove that a programming change caused an outcome.

### Accepted adaptation explanations

Uses the existing Adaptation Explanation records. The Companion describes a programming change only when a stored athlete-approved review supports it.

If there is no accepted change, the Companion must not invent one.

## Shared context

The same intelligence snapshot is attached to the existing bounded Companion context. That means it is available to:

1. the signed-out deterministic text Companion,
2. the secure signed-in Coach request, and
3. Voice Companion through the existing live-context / secure-Coach tool path.

The expensive analysis is cached and recomputed only when relevant workout, draft, review, or current-exercise state changes.

## Security and product integrity

The secure Coach gateway treats the intelligence snapshot as untrusted structured data and keeps the existing server-owned provider boundary.

The model is instructed to:

- use the deterministic snapshot for personalized training facts,
- preserve its evidence limitations,
- avoid readiness/recovery claims that are not present in the data,
- avoid causal claims from descriptive progress trends,
- never invent adaptations,
- never claim a training change was applied unless an existing Loadnote workflow actually applied it.

## Data integrity

v2.83 does not change training storage semantics.

- schema remains v25
- no migration
- internal strength load remains kg
- displayed kg/lb remains a presentation concern
- actual RPE remains separate from target RPE
- no e1RM formula change
- no training-max change
- no progression-policy change
- no fatigue/status calculation change
- no workout-history mutation
- no meet-cycle policy change

The intelligence snapshot is derived and read-only.
