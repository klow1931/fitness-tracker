# v3.60 Combined Recovery, Coach & Meet-Prep Pilot

**Pending manual sign-off.** These steps are not satisfied by passing synthetic tests. Obtain consent, protect backup files and keep all personally identifying workouts out of public GitHub issues and artifacts.

## Legacy data and durable logging

1. Use a copy of a valid legacy backup on a separate test device. Verify its manifest if present, examine the recorded migration summary and confirm exact record identities, dates, completed sets, reps, RPE and display units after restore and restart. Never replace the athlete's only current copy.
2. Test a malformed/tampered backup and a change to local data while the import review is open. Confirm that import is rejected without loss of the newer training.
3. On iOS and Android: log several sets offline, force-close during an unsaved draft, reopen, correct a set, simulate full storage in a controlled test, export to Files, then restore onto a separate clean test install.
4. Change kg/lb display and confirm the same actual load remains canonically stored in kg. Record exact pre/post values and audit history; any silent loss or conversion failure blocks beta.

## Athlete-controlled Coach

1. Ask Coach for a training recap with no data, sparse effort data and a completed week. Review whether it states what happened, what is unknown and the next action without invented physiological changes.
2. Propose new training days, exact available equipment, 75-minute sessions and a priority. Close every review once without saving; verify unchanged profile and workouts. Then explicitly Save one at a time and confirm append-only profile revision history.
3. Change the saved Profile between the suggestion and Save. Confirm the stale proposal cannot overwrite it. Try ambiguous or unavailable equipment and medical/injury commands: no silent preference update.
4. Verify evidence buttons open the correct log, Progress or movement-mapping screen, and no workout is marked completed by navigation.

## Full meet-prep handoff

1. Request an 8-, 20-, and 52-week meet/mock-meet cycle. Confirm the requested duration, available days, equipment, minutes, and priority are shown before reviewing the frozen lift setup.
2. Confirm the five-stage timeline totals the requested number of weeks, exact start/event dates, and that the meet week has no automatically assigned attempts.
3. Add an unrelated scheduled Calendar session in the same date range. Confirm the conflict warning is visible and scheduling refuses to overwrite it until explicitly resolved.
4. Verify no chat proposal automatically saves a plan. Save a reviewed cycle without scheduling, then separately approve scheduling and compare the immutable original prescriptions.

## Sign-off record

For each test record date, pseudonymous tester, phone model, OS, build 33404, pass/fail, reproduction steps, backup verification outcome and severity. Stop distribution for data loss, unintended load changes, cross-account exposure, unsafe prescriptions or inability to recover a workout. Complete the [Phase 6 beta gates](phase6-athlete-beta-acceptance.md) before considering wider distribution.
