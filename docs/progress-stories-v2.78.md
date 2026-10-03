# v2.78 — Progress Stories

## Goal

Progress should answer four questions before exposing analytics tools:

1. What is changing in strength performance?
2. Am I completing the training plan?
3. What recent evidence is meaningful enough to call out?
4. What accepted programming changes were made, and why?

The default Progress surface is intentionally a summary. Detailed movement evidence, adherence breakdowns, programming history, Training Review, record tools, measurements, and progress photos remain available through **Explore Progress**.

## Evidence model

v2.78 extends the existing v2.72 read-only Progress Story model. It does not create a new training engine, readiness score, or adaptation policy.

### Strength

Strength direction continues to compare the first four weeks of the selected story window with the most recent four weeks using RPE-aware demonstrated-capacity evidence. At least two eligible evidence days are required in both comparison windows. Sparse or missing evidence remains explicitly unresolved.

### Consistency

When scheduled sessions exist, consistency uses resolved-session adherence:

`completed / (completed + explicitly skipped)`

Unresolved and cancelled sessions remain visible but are not counted as failures. When no scheduled sessions exist, Loadnote reports logged session frequency without inventing an adherence percentage.

### Milestones

Milestones are bounded to claims the stored evidence supports. A demonstrated-capacity milestone compares recent RPE-aware performance with earlier eligible evidence inside the selected story window. It is not labeled an all-time PR or tested 1RM.

A consistency milestone may state that all recent **resolved** sessions were completed when at least four sessions have been resolved. This does not imply unresolved or cancelled sessions were completed.

### Recent changes

Recent changes come only from accepted programming-review history. The story includes the stored action, reason, and evidence. Loadnote does not infer that a programming change caused later performance.

## Data integrity

- Read-only summaries; no stored-data migration.
- Schema remains v25.
- Internal load storage remains kg.
- No change to RPE, estimated 1RM, training-max, progression, fatigue/status, adaptive programming, or meet-cycle policy.
- Existing workout history and accepted review records remain the source of truth.
