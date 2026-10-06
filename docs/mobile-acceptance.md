# Mobile acceptance and logging benchmark

Status: physical-device checks pending. Chromium results do not establish Safari, WebView, real keyboard, background timer, or human logging-speed behavior.

## Safe setup

Export a backup first and verify its file exists. Use a disposable test profile/browser rather than editing real training to manufacture a benchmark. Import only into a separate test instance. Record release/build, device, OS, browser/app, text size and orientation. Never reset the real profile to run this checklist.

## Acceptance checklist

| Scenario | Expected result | Device result |
| --- | --- | --- |
| Normal and larger OS text; portrait and landscape | Labels wrap, primary controls remain readable and reachable, no clipped target values | Pending |
| Numeric keyboard on load, reps and RPE | Focused field can be seen and edited; sticky/floating controls do not intercept it | Pending |
| Complete a set, undo, complete again | Exactly one explicit completion each time; original effort is restored by undo; reps/load retained | Pending |
| Rest, lock phone for 60 seconds, resume | Remaining time follows the original deadline; no fabricated paused/background interval | Pending |
| Switch apps during an unsaved workout, return and reload | Acknowledged saved draft returns; targets/history are unchanged | Pending |
| Actual load differs from plan; leave one RPE blank | Reviewed saved workout reflects entered load; blank effort stays unknown | Pending |
| Reviewed save, then reopen history | One workout saved with the reviewed sets; no duplicate after repeated activation | Pending |
| Controlled storage failure in a disposable test instance | Failure remains visible; retry saves the same draft without silently confirming success | Pending |
| Export, restore into a separate instance | Dates, units, recorded sets, reviewed prescriptions and revisions match the source | Pending |

For failures, record the exact screen, action, expected/actual behavior and screenshot. Do not include private backups in public issue reports.

## Human logging baseline

Use the same scheduled three-set workout on the same phone for three trials. Start with the workout visible on Home. Record button taps separately from keyboard entry and scrolling. Time from Start workout to acknowledged save; stop timing during simulated rest, or report rest separately. Enter the actual load/reps and explicitly record RPE for each performed set. A blank RPE must remain blank if not provided.

Record median active logging time, button taps, correction/undo count, accidental activations and any need to hunt for controls. Compare against the preceding release on the same setup. Browser clock durations and click budgets are not human-speed results. Improve whichever measured step is slowest; do not infer a product speed improvement without these trials.

The automated three-set path expects five button activations (start, three completions, review), plus the separate explicit Save activation. It verifies that untouched effort stays unknown until each completion and scheduled targets/history are not modified before save.
