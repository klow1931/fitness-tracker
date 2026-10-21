# Loadnote v3.80.0 — Curated Coach knowledge that stays on topic

## Scope
v3.75–v3.79 introduced unified offline training evidence, conversational continuity, reviewed choices, personal approved-outcome history and resilient model fallback. v3.80 strengthens the last important trust boundary: **which educational topic does a short question actually refer to, and which sources support the answer?**

## What changed
- The offline Coaching Library resolves short questions such as “Why?”, “Tell me more” and “How does that apply for me?” only from a recent eligible athlete-authored educational topic. The topic can survive a short chain of such follow-ups, but not a later independent question.
- Questions such as “What sources support that?”, “Where did that come from?” and “Can you cite that?” reveal the **specific public sources and their coverage** for the supported topic, not an unrelated full bibliography. If there is no confirmed topic, the Coach asks for one.
- The existing source cards and mobile Coach source panel are reused; no duplicate knowledge store, model download, network requirement or retraining is introduced.
- Context never derives facts from assistant messages. A medical question, new workout-history request, independent topic or RPE definition cannot be recycled as an educational referent. Medical concerns, training decisions and saved performance still use their established deterministic handlers.
- The app continues to identify full books as references rather than claiming the copyrighted books were imported or a model was trained on them.

## Technical boundaries
Only \`src/product/coaching-library.js\` changes for the knowledge logic. Its finite curated retrieval and source catalog are reused. The test suite adds regression cases for topic expiry, chained follow-ups, attempted assistant contamination, source specificity, injury priority, model-independent offline answers, and unchanged athlete data. One small browser test exercises the source panel and reset on a mobile viewport.

**No data model changes.** Schema **34**, internal recorded loads **kg**, no migrations. Development app **3.80.0**, unsigned native beta build **34000**.

## Verification and rollback
Require \`npm run check\`, \`npm test\`, complete Chromium and iPhone WebKit suites, Android/iOS compilation and device QA before promoting. These deterministic tests do not establish broad or open-ended AI intelligence. The last merged v3.79 remains the rollback until v3.80 passes CI and on-device update/offline tests.
