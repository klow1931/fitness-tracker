# Pre-Android demo cleanup

This patch addresses the main findings from the 9 October 2026 user-style demo. It builds on the merged v3.23 coaching-boundary release; it does not deploy or certify an Android release.

## Changes

- Route explicit recent competition-lift workout comparisons to corrected recorded history, before approved-change handlers. Exclude future workouts, require a single confirmed mapping, display requested units and retain unknown effort. The comparison is read-only and does not claim strength gain or prescribe a next load.
- Recognize requests for recent lift evidence and resolve the immediate user-reported lift without treating assistant statements as evidence or carrying it across unrelated topics.
- Render adaptive before/after loads using the existing display formatter, keeping storage and approved targets in kg. Calendar explanations name omitted exercises rather than internal IDs.
- Clear saved-session recap content when replacing/clearing a draft or entering new draft content. Repeated-workout cockpit titles reflect the editable draft date; the immutable source-plan provenance remains unchanged.
- Show a saved-unscheduled phase plan as the primary planner action; opening it expands the saved plan to its explicit Schedule control. Saving still does not automatically schedule.
- Explain missing deviation context in workout review and offer a direct reason-editor action. Saving remains possible without inventing a reason.
- Correct accessory effort-cap explanations at display time in phase/meet/short-block previews and the workout viewer. Stored reviewed records and their validation fingerprints remain unchanged.
- Hide first-use tips after training setup and a saved workout, clarify unsupported weekly-review categories, explain Calendar plan prerequisites before accepting a name, and replace the rehabilitation role label with fitness-only accessory wording. The persisted role key is retained for compatibility.

## Verification

Node regressions include the exact numb-arm demo question, recent-history/evidence routing, future exclusion, mapping gaps, immutable reviewed-program routing, cap text, recap clearing and human-readable omission reasons. Browser tests cover recap replacement, current repeated date, reason-editor handoff, saved-plan scheduling, empty Calendar prerequisites, completed setup and pounds previews with kg target preservation.

Local syntax/Node/mobile/native-source checks are run separately from browser and device checks. This workspace cannot install Chromium (the browser download is empty/truncated), so browser assertions require CI. Android compilation/signing and physical-device acceptance are not established by these source checks.

## Remaining gates

Run full desktop/mobile browser CI before merging. Then retest the intended Android artifact on physical devices: clean install and upgrade, kg/lb reviews, workout recovery after process death, back/keyboard behavior, offline logging, actual backup restore and native photo/share operations. Account and provider paths need a configured test environment. Signing, privacy/store declarations, clinical boundaries and Play acceptance remain separate owner gates.

Minor findings not changed here include repeated program-reference text and the existing zero-versus-unentered cardio-distance representation; they should remain on the polish backlog. No workout data schema migration or training-target recalculation is introduced.
