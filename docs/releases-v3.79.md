# Loadnote v3.79.0 — Coach continuity when AI is unavailable

## Goal
The v3.75–v3.78 Coach can explain validated training records, sustain bounded conversations, distinguish evidence from options and review the outcomes of athlete-approved changes. This release improves **reliability at the boundary between deterministic training guidance and optional AI**, rather than inventing a new coaching decision engine.

## Changes
- If an authenticated online Coach request fails, the existing local reply remains available **with its supporting evidence, reference links and review controls**. Before v3.79, only the plain text was rendered, discarding useful source details and action links.
- A rejected or empty local WebGPU model conversation response no longer breaks the chat. Where there is supported deterministic guidance, the Coach presents it as built-in guidance and indicates that the optional model was unavailable.
- A failed optional model *reference explanation* similarly falls back to the existing cited public coaching guidance. The coach composer and subsequent questions remain usable.
- Consent to private local AI conversation remains local-only even if model generation fails: no automatic online server fallback.
- Verified recorded-workout history and corrected-lift evidence remain authoritative local responses for signed-in athletes, not optional online paraphrases. The app does not persist generated text as athlete evidence and never approves a training change.

## Limits
No general LLM upgrade, web browsing or new model runtime. This is not evidence that the optional local model's answers are always accurate. Source references are the existing curated Coaching Library, with its documented coverage restrictions. A local reply reports only what existing training systems can validate, not physiological recovery, medical clearance, or new targets.

## Integration
No athlete data schema migration; schema **34** unchanged. Internal loads stay **kg**. The web app, package, PWA cache and unsigned native beta all move to **3.79.0**, build **33900**.

## Testing
`tests/browser/coach-v379.spec.js` checks: online HTTP failure with retained evidence/source panel and no writes; rejected on-device conversation with no network calls; rejected local reference explanation with source citations retained. The existing unit/contract suite, full Chromium browser regression suite, iPhone WebKit gate and Android/iOS compilation must pass before review. Physical-device Home Screen update and offline regression testing are still required prior to production rollout. Preserve the merged **v3.78** rollback.
