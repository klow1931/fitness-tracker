# Progress story (v2.72)

## Purpose

Progress should answer a small number of athlete questions from saved training evidence:

- What has my training looked like recently?
- Is comparable strength evidence higher, lower, or similar?
- Am I following the reviewed program?
- What programming decisions were accepted during this period?
- What evidence is still too sparse to interpret?

The feature is descriptive and read-only. It does not create a readiness score, diagnose fatigue, or apply program changes.

## Views

### Overview

Shows recent session count, strength-set count, plan adherence, RPE coverage, current reviewed-program context, and compact direction cards for featured movements.

### Strength

Shows one story per confirmed competition lift when mappings exist; otherwise it falls back to the most-trained recent strength movements. Each story keeps exercise identity and tracking mode separate and reports:

- best recent eligible set
- best recent RPE-aware demonstrated-capacity estimate
- recent four-week volume
- average logged RPE
- session/set counts in the selected evidence window
- accepted programming reviews linked to the lift

Direction compares the first four weeks of the selected evidence window with the most recent four weeks. Both windows require at least two demonstrated-capacity days. The comparison uses the median of each day’s best RPE-aware demonstrated-capacity estimate in each window, reducing the influence of a single unusually high or low session. It is not a tested 1RM or a fitted growth rate.

### Adherence

Recent and current-program adherence uses the existing schedule definition:

Completed / (completed + explicitly skipped)

Unconfirmed, upcoming, and cancelled sessions remain visible but are excluded from the adherence percentage. They are not silently treated as failures.

### Program history

Accepted phase and meet-cycle reviews are shown chronologically with each lift's stored action, explanation, and evidence. Kept plans remain visible alongside changed prescriptions.

The timeline does not infer that an accepted change caused a later strength result.

## Evidence and unit rules

Loads remain stored in kilograms. Display conversion uses the existing unit helpers.

Demonstrated-capacity estimates reuse Loadnote Core evidence rules. Missing/invalid RPE, low-RPE work, high-rep work, and submaximal singles do not become capacity estimates simply to fill a chart.

Variations are not merged into competition lifts unless they share the same existing exercise identity.

## Compatibility

v2.72 does not change:

- schema v25
- workout storage
- schedule records
- RPE calculations
- legacy estimated 1RM calculations
- training-max calculations
- adaptive thresholds
- phase progression
- meet-cycle progression

The progress-story model only reads existing state and accepted review history.
