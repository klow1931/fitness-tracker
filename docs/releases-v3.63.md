# Loadnote v3.63.0 — Custom Program Studio

Loadnote now lets an athlete bring their own week-by-week training plan, review every parsed exercise, schedule it and compare it with linked training results. This is a device-local feature; it does not transmit uploaded file contents to a server or external model.

## How to use it

1. Go to **Coach → Programs → Custom Program Studio → Write or upload a program**.
2. Give the program a name, choose 1–52 weeks and a **Monday start date**. Loadnote uses Monday–Sunday within each program week.
3. Enter movements and loads one at a time, copy a week forward to edit it, paste plain-text sessions, or upload a supported file.
4. Review all exercise cards (15 at a time) and specify weight units. Blank numeric load units use the visible unit selector; file units override that selector. Unknown loads and RPEs stay unknown.
5. Preview the sessions and conflicts; confirm the exact program to save it. Scheduling is a second explicit choice and never overwrites existing scheduled sessions.
6. Start the linked workouts from Calendar. In Program Studio, **What Loadnote has learned** summarizes recurring movements and exact planned-versus-actual linked sets. Ask the offline Coach about your uploaded program to discuss the same evidence.

## File support

| Format | What is supported |
| --- | --- |
| CSV / TSV | Header-based rows with Week, Day, Exercise, Sets, Reps and optional Weight, Unit, RPE, Rest, Type, Minutes, Notes. Standard quoted CSV including multiline cells. |
| Excel XLSX | First worksheet; the same header columns as CSV. Formula cells use their saved result, if available; macros are not run. XLS and Google Sheets links are not directly supported. |
| Plain TXT / pasted text | `Week 1`, `Monday`, then `Competition Squat 4x5 @ 315 lb RPE 7`. This intentionally narrow format avoids inventing targets. |
| Text-based PDF | Local page-text extraction and the same conservative `Week`/`Day`/`sets × reps` parser. Scanned/image PDFs need OCR outside Loadnote; complex multicolumn tables may require corrections. |
| Standalone JSON | `{"format":"loadnote-program-v1","name":"...","weeks":2,"startDate":"2026-11-02","rows":[...]}`. Export a saved plan to see the complete schema. |

**Data backup files are different:** JSON full-app restores belong in Tools and may replace current data after preflight; they are intentionally rejected by Custom Program Studio.

Program rows use **Week 1–52**, **Monday–Sunday** (or day numbers 1–7), exercises with **1–12 sets × 1–50 reps**, optional exact loads in kg or lb, optional RPE cap 1–10, optional rest 60–600 seconds. Cardio rows use Type `cardio` and Minutes 1–360. Up to 1500 exercise rows and 20 movements per training day are accepted. PDFs and XLSX files are capped at 10 MB; PDFs at 40 pages.

The CSV example can be downloaded inside Studio. An imported spreadsheet should have one exercise per row. Distinct weeks are **not** interpolated or repeated automatically: copy a week forward and review each change if you want the same training days in later weeks.

## Learning and evidence boundaries

- The source plan remains a reviewed, immutable athlete-authored baseline. Copy to edit produces a new independent plan. Calendar revisions and completed sessions are separate records.
- Coach can describe planned movement frequency, programmed sets, first/last explicitly specified loads, linked completion status and exact rep/load matches. That is contextual evidence retrieval, not retraining an LLM or automatically inventing a new program.
- Unknown weights, estimated 1RMs, progression rules, training maxes and missing effort measurements are **not filled in**. PDF interpretation requires user verification. Imported notes stay with the saved source entries; the scheduling model only executes supported structured targets.
- Only a completed workout explicitly linked to an approved Calendar session is counted for that custom program. Importing historical program files does not retroactively assign old workouts to new sessions.
- Current medical/injury safety boundaries remain in effect; no medical diagnosis or treatment is inferred from personal program notes.

## Validation

- Node model tests cover parsing, non-English-style CSV quotes, error rejection, unit conversion, exact scheduling, conflicts, immutability, sync and backup integrity.
- Desktop/mobile browser regressions cover uploaded CSV/XLSX and Coach/Calendar wiring where browser runners are available.
- Native iOS/Android device testing, scanned-PDF OCR, large irregular real-world spreadsheets, direct PDF table recovery and store validation remain separate acceptance steps.
