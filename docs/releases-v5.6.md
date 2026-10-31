# Loadnote v5.6.0 — Understanding and broader conversations

Combines the proposed v5.4–v5.6 milestones into one reviewable release. Version **5.6.0**, development build **37600**, schema 34 unchanged.

- A reproducibly trained, bundled multinomial naive Bayes intent classifier recognizes additional phrasing. Numerical facts and decisions still come from existing tools. Scores are routing heuristics, not calibrated confidence or scientific certainty. Unknown wording can abstain; no claim of general language understanding.
- Two explicit informational questions can be answered independently with their evidence and sources preserved. Existing authoritative handlers retain priority.
- Reviewed links connect existing curated concepts across at most two edges. Sources distinguish public research summaries, coaching methodology and book listings; downloaded abstracts do not update policy automatically.
- Talk it through opens a session-only reflection workspace for everyday situations, desired outcomes, user-named options, a next step and obstacles. Listening, recaps and corrections use athlete-authored text only. This is authored conversation composition, not unrestricted factual generation or therapy.
- Reply preferences, reviewed training-profile changes and approved-change outcomes remain the personalization mechanisms. No automatic chat collection, new persistent memories, learned training doses or causal claims are added.
- Explicit Online chat uses the existing authenticated server/provider gateway for broader topics without a model download. It starts with empty online history, sends minimal context and only its own recent online turns, and excludes offline and deterministic training replies. It is session-only and resets on Clear conversation/reload. Text chat sends no unanswered messages while Online chat is off, including when signed in. Exact training questions and safety boundaries stay local. Native beta remains local-only. GitHub Pages cannot run this backend; an operator must configure hosting, provider access, authentication and provider/retention terms before enabling it publicly. Research connectivity is independent.

## Validation

Run `node scripts/train-coach-intents.js --check`, `npm run eval:understanding`, the full unit/static suites, browser regressions and native packaging gates. The held-out language set is separate from training phrases and reports correct accepted classifications, errors and abstentions independently. Dialogue scenarios verify corrections, topic resets, user-only context, preservation of unknowns and immutability. A synthetic benchmark does not establish real-user language quality or training effectiveness. Hosted-provider quality and physical-device usability require separate acceptance.
