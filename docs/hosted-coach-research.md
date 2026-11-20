# Hosted Coach with public research

Coach's hosted LLM runs on a server, using the existing OpenAI-compatible gateway.
The phone downloads no model weights for this path. Loadnote does not train its
own foundation model. Built-in offline Coach remains immediately useful without
an LLM; optional local-model functionality remains available separately.

The explicit **Explain online · no download** action on research cards sends a
public topic ID to the authenticated Loadnote backend. The backend retrieves fresh
Europe PMC abstracts using the existing fixed training-topic catalog and result
normalizer. It rejects redirects, client URLs/source lists, oversized responses,
retracted/ineligible papers and empty evidence. No raw question, conversation,
workout record or injury note is sent to Europe PMC. The LLM receives only the
fresh public evidence, a server-owned question and minimal server-owned context;
even a client-supplied history/context is excluded for research explanations.

Source data is an untrusted user-role message beneath a server-owned research
policy. Model responses cannot supply the citation list: returned links, dates
and excerpts come from normalized retrieval. Recommendations are forced to
`none` with null training doses. The UI labels the answer an AI interpretation,
retains source limits, and does not change training. Empty/failed retrieval never
calls the model. Offline/failed/cancelled UI requests retain available local
guidance/source cards; late results after a permission change are ignored.

This is bounded indexed-training research, not arbitrary internet navigation or
full-text article review. No source content is executed and no URL from a source
is followed automatically. Public excerpts and the request are processed by the
configured LLM provider under its terms. Existing auth, CSRF, origin checks,
account rate/concurrency limits and provider timeouts remain enforced.

## Operator activation

Deploy the existing Node backend on an HTTPS origin that serves the app and
same-origin `/api` routes (or a managed reverse proxy preserving that boundary).
Configure the existing production OIDC, durable account/session stores and
server-only `LOADNOTE_AI_API_KEY`, `LOADNOTE_AI_BASE_URL` and
`LOADNOTE_AI_MODEL`. Set `LOADNOTE_COACH_RESEARCH=1` after verifying provider
terms, capacity and cost limits. Optional `LOADNOTE_RESEARCH_TIMEOUT_MS` is capped
at 12 seconds. Public health reports configuration capability, never keys/models.
No client API-key entry, arbitrary endpoint or consumer developer controls are
introduced. Current native beta keeps its existing local-only online boundary.
The backend also serves the app's public appearance stylesheet and uncached
version manifest; both were absent from its earlier allowlist. Public-root
asset tests retain denial of backend source and package/configuration files.

GitHub Pages cannot execute this backend. Repository code and mocked integration
checks do not prove a publicly deployed LLM works. Production activation requires
actual hosting, identity-provider configuration and model-provider credentials;
none are provisioned or billed by this code change. Verify sign-in, consent,
source retrieval, grounded replies, limits/failures and offline fallback on the
deployed service before calling hosted Coach live. Do not publish an unmerged or
failing candidate. Keep physical-phone evidence separate from browser profiles.

Validation reuses research/client/server tests and Chromium/WebKit research
journeys with synthetic data and controlled responses. These tests do not assert
live provider availability, model accuracy, physiological readiness or medical
advice. Rollback: approved main `92386e0c1b437799c53715f0fd6a71cd9caeb606`,
runtime7.11.0/build40100/schema34.
