# Loadnote v4.5.0 — Plan Continuity and Contextual Coach

## Review fixes
- Keep approved rep ranges in the Home/Train target preview. Last logged set now means the last valid performed set in the most recent eligible session; marked warm-ups and incomplete/skipped sets are excluded. Existing identity, unit, chronology and convention guards remain unchanged.
- Find starter-plan descendants through validated saved revision ancestry, including Studio copies whose import source label changed. Label original and edited versions and require explicit selection when ambiguous. Future and superseded records remain excluded as of the requested date.

## Continuing a plan
- First-week tips graduate to a compact Your plan action while a reviewed starter plan remains available. Unfinished drafts, overdue review and scheduled sessions retain priority.
- The saved-plan picker offers all reviewed weeks, exact strength/cardio targets and rep ranges. It remembers an explicitly reviewed version on this device and validates that ID before reuse; it never silently replaces a prescription or marks training complete.
- Device-only selection uses loadnote.starter-selection.v1. It is not a training result or an inferred preference and does not change the backup schema.

## Coach
- Broaden common beginner phrasing, including never having lifted before.
- What should I train today acknowledges the selected saved/scheduled starter version and routes to its actual review or Calendar.
- Progression questions ask about exercises in that plan, offer freshly validated exercise history and link existing feedback/Studio review tools. No automatic load increases, guessed RPE or new progression policy are introduced. Medical/urgent-support checks retain precedence.

## Code scanning
The prepared advanced CodeQL workflow installs Capacitor dependencies before the manual Swift/Xcode build, disables incompatible Swift caches, and preserves the repository's other language coverage. PR runs produce reviewable SARIF artifacts without competing uploads. GitHub's existing default setup must be switched to advanced by a repository administrator before main-branch uploads can replace the failing default Swift scan. See [CodeQL setup](codeql-setup.md). Do not claim the existing default scan is fixed before that setting change and a successful uploaded analysis.

Version **4.5.0**, unsigned native build **36500**, schema **34** unchanged. No historical workout migration, automatic scheduling, changed training maxes or silent progression. Physical device and VoiceOver acceptance remain separate.

## Integration order
This release builds on the pending v4.3 audit (#235) and v4.4 dialogue (#236). Merge those in order, then retarget this stacked PR onto main. Their evidence-routing and dialogue changes are preserved. The dialogue module is also included in the offline cache; integration checks caught that omission in the pending v4.4 branch.
