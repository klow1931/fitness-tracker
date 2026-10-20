# Loadnote v3.73.1 — Program review corrections

This patch fixes four issues reproduced in the v3.73 training demo. Schema remains **34**, internal loads remain **kg**, and native build advances to **33481**.

- **Import fidelity:** Text and PDF exercise lines with rep/load ranges, AMRAP (+), or percentage targets stop import with a line-specific explanation. Choose an explicit fixed target in the source file before importing; the current fixed-target editor does not support those prescriptions. Supported rest values in seconds/minutes become rest allowances, and remaining instructions become exercise notes. Failed imports preserve the existing Studio draft.
- **Weekly feedback:** Even one comparable set above its saved RPE cap prompts effort review. Such a week cannot receive the fallback claim that comparable logs stayed within their effort caps. This remains descriptive feedback, without automatic prescription changes.
- **Upcoming workouts:** Coach excludes Calendar-linked workouts already logged by the review date from upcoming custom sessions. A request for an already logged day says so. Later-recorded workouts do not change an earlier dated answer.
- **Exercise cues:** New Calendar prescriptions retain program exercise notes. The logger shows them as text alongside the matching exercise, separately from editable personal notes, and restores them with the unfinished workout draft. Changing the exercise removes the old cue. For older Calendar snapshots missing this field, the logger reads the cue from the exact linked original custom-program session. Existing scheduled snapshots remain immutable.

Validation covers unsupported targets, rest/cue extraction, single above-cap feedback, known-date completion, prescription round trips, safe cue rendering, actual workout completion and mobile draft recovery. The new browser demo runs in both Chromium projects and the iPhone WebKit CI gate. Automated checks do not replace physical-device acceptance.
