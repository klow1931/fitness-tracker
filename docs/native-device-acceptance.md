# Native device acceptance — current release candidate

**Status: NOT RUN on physical devices.** Automated browser tests use a mocked native bridge; compilation jobs do not launch an app. Do not mark a row passed from those results. Use synthetic training for destructive/reinstall checks, retaining an external backup and the original production data on its source device.

v3.21 adds a real packaged Android WebView/Filesystem emulator gate and a separate installable debug beta. See `build-android-emulator/acceptance.json` in successful beta artifacts for evidence. DOM-driven emulator intake/logging, cache JSON/reviewed import, activity recreation, force-stop and same-certificate install do **not** complete physical-device, actual soft-keyboard/touch, Android Back, external picker/share or TalkBack rows below. Compilation-only workflows still do not launch the app.

Create a separate result record per platform: app version/build, commit, device model, OS version, tester, date, installation/signing channel, pass/fail/blocked, screenshot or log reference and issue link. Omit personal training content from shared evidence. Confirm approved developer identity and signing before installation; this release does not provision signing or distribute a build.

| Test | Procedure | Pass evidence | Current result |
|---|---|---|---|
| First launch and navigation | Cold launch, review/dismiss/reopen beta welcome, navigate all tabs and back | No blank screen; safe areas and controls usable | Not run |
| Keyboard and units | Enter exercise, decimal load, reps, RPE and notes in kg and lb; review/save | Keyboard does not hide required controls; saved kg value and displayed conversion correct | Not run |
| Draft lifecycle | Start draft, background, resume, force-stop, reopen | Intended draft values/checkmarks retained; no duplicate session | Not run |
| Saved training lifecycle | Save session, force-stop, cold launch and same-ID upgrade | IDs, dates, kg loads, programs and revisions retained | Not run |
| Offline cold launch | Enable airplane mode, force-stop and launch; log/save/reopen workout | Local logging and guidance work; unavailable online features explained | Not run |
| External JSON backup | Export and choose Files/external destination; inspect saved file | File exists outside app; nonempty JSON; fingerprint passes import review; reminders not falsely cleared | Not run |
| Share cancellation/failure | Cancel sharing; simulate unavailable destination | Training remains intact; no verified-backup claim | Not run |
| Restore rehearsal | Save a fixture backup; change test data; review/import it | Explicit replacement; restored IDs/programs/revisions/units match; recovery snapshot retained | Not run |
| Import cancellation/corruption | Cancel review; then select altered/truncated fixture | No replacement; corruption explained | Not run |
| Save failure | On disposable fixture storage, provoke or instrument a write failure | Original durable state retained; retry/cancel available; error visible | Not run |
| Photos | Export separate photo JSON, cancel once, save once; exercise existing photo restore path | Routine training JSON excludes images; saved photo file accessible; no unexpected permission prompts | Not run |
| Fresh sandbox restore | On separate test install/device, restore saved fixture without deleting original | File picker opens; expected history/units visible after cold restart | Not run |
| Accessibility | Large text, VoiceOver/TalkBack and small/notched screens | Names/order understandable; forms and actions reachable | Not run |
| Service boundary | Try account/cloud/online AI/voice | Explicit local-only state; no login/microphone prompt | Not run |

Uninstall, clear-data and app-ID changes can erase the sandbox. Local recovery snapshots cannot survive its deletion. Test these only with disposable data after confirming the external backup restores. If any data-loss, restore, critical keyboard or offline-launch row fails, block beta approval and link the issue. Re-run affected rows after fixes. Store privacy declarations, SDK upgrades, production identities and distribution signing are separate release gates.
