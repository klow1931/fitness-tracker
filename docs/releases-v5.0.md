# Loadnote v5.0.0 — Coach conversations, references and program follow-through

This release completes the proposed **v4.8**, **v4.9** and **v5.0** milestones as one deployable update. [Conversation changes](releases-v4.8.md) and [reference retrieval](releases-v4.9.md) have dedicated notes.

## Program follow-through

“Is my program working?”, “Am I on track?” and similar requests open a read-only view of the exact selected program. Overlapping programs require a selection. The active/latest dated program is validated before its evidence is interpreted; future records and unresolved historical cancellation context are excluded or reported unavailable.

Meet/phase programs reuse the existing weekly evidence, phase policies and adaptive controller. When supported, the view shows exact before/after future-target proposals and opens the dated Decisions review for that program and week. It does not apply them. Custom programs reuse their weekly observations and route to that program’s Studio review. Sport and hypertrophy plans retain their dedicated review policies. Their review buttons open the exact selected record, including when other programs overlap; they do not reselect a plan through the global lifecycle. Prior approved-change observation counts are labelled as spanning saved history, not proof that this program caused improvement.

Custom-program reviews now reconstruct corrected workout history at the requested cutoff and require the logged prescription to match its exact linked Calendar revision. Skipped, warm-up and explicitly incomplete sets cannot establish achieved targets in planned-versus-actual comparison. Missing RPE, different work and duplicate links remain evidence gaps. Check-in notes are omitted from the new conversation evidence payload.

## Repeatable capability evaluation

`npm run eval:coach` runs a versioned set of **45 scenarios** covering natural requests, focused questions, corrections, missing/ambiguous inputs, topic resets, equipment restrictions, source relevance, safety routing, program identity and state immutability. It also runs in the regular unit suite. Failures identify the scenario and expected behavior.

Local AI settings offer **six optional device-only probes**: three source explanations and three tool classifications, using synthetic prompts and no athlete records. Tool tests are skipped without local-conversation permission. The evaluation requires an already-ready model and never downloads weights. Cancellation stops the remaining probes; the current bounded generation may finish before cancellation is reported. Keyword and enum checks measure narrow behavior, not general intelligence, scientific accuracy or safe individualized prescribing. Review failures rather than treating the pass count as a certification.

## Build dependency security

Pin the build-only `rimraf` → `glob` dependency to 14.0.3, which resolves patched minimatch 11.0.3 in the lockfile. Capacitor 7 remains unchanged. This scoped override addresses GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249 without disabling the dependency audit or downgrading Capacitor. Native synchronization and compilation remain compatibility gates.

## Release and acceptance

Version **5.0.0**, unsigned native development build **37000**, schema **34** unchanged. No new backend, credential, data migration or automatic training writes. Existing research permissions and session-only conversation memory remain in place. Real-model answer quality and performance, and physical iPhone/Android acceptance, require separate device review; model probes are provided for that process.

Validation covers the capability benchmark, dated/linked training evidence, corrected custom logs, reference provenance, reviewed UI handoffs, device-probe behavior, existing Coach/planner regressions, release consistency and web/native packaging. Automated model tests use deterministic doubles and do not establish real-model quality.
