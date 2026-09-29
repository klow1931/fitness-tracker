# Production online Coach boundary (v2.63)

## Purpose

Loadnote remains an adaptive training log first. Online Coach is an optional explanatory layer over structured training evidence; deterministic programming and review logic remain authoritative for actual training changes.

v2.63 replaces the old browser-configurable provider path with a production-safe server boundary.

## Consumer request flow

1. The athlete signs in to a Loadnote account.
2. The browser builds bounded structured context from local Loadnote records.
3. The browser sends only:
   - the current athlete question
   - a bounded recent user/assistant conversation history
   - structured Loadnote context
4. The authenticated Loadnote server verifies the session and CSRF boundary.
5. The server constructs the trusted Coach system prompt.
6. The server sends the trusted prompt + bounded context to the configured AI provider using a server-side secret.
7. The server parses and bounds the provider response.
8. The browser receives only the structured Coach result.

The browser does not select the provider/model, supply a custom system prompt, or hold a provider credential in the normal consumer path.

## Server configuration

Supported environment configuration remains server-side:

- `LOADNOTE_AI_API_KEY`
- `LOADNOTE_AI_BASE_URL`
- `LOADNOTE_AI_MODEL`
- `LOADNOTE_AI_TIMEOUT_MS`

Production online Coach always requires a Loadnote account session, even if a deployment explicitly relaxes the general account requirement for other endpoints.

Cookie-authenticated POSTs require the existing `X-Loadnote-CSRF` value. Bearer-authenticated requests use the existing signed-session primitive.

## Accepted client body

`POST /api/coach` accepts a bounded JSON object containing:

```json
{
  "question": "string",
  "history": [
    {"role": "user", "content": "string"},
    {"role": "assistant", "content": "string"}
  ],
  "context": {}
}
```

The gateway rejects:
- raw provider-style `messages`
- browser API keys
- provider selection
- model selection
- custom provider/base URLs
- client system prompts

Context is size/depth bounded. The trusted system prompt explicitly treats every context value as untrusted data, never instructions.

## Structured training context

Coach context is deliberately smaller than a full account export. It can include recent training summary/evidence, current athlete goals, nutrition coverage summaries, bodyweight, PRs, the most recent AI advisory result, and the current active-program lifecycle.

Weight-bearing values sent to the provider are explicit kilograms:
- `weightKg`
- `estimated1RMKg`
- `targetWeightKg`
- athlete goal `targets[].kg`
- recommendation `weightKg`

The athlete's display unit is separate metadata. This prevents a stored kg value from being silently interpreted as pounds.

Progress photos, recovery snapshots, local device preferences, remote sync metadata, provider secrets, and complete account snapshots are not sent as Coach context.

## Provider response contract

The server expects the provider to return structured JSON with:
- concise summary
- bounded insight rows
- one advisory recommendation
- confidence label

The response is parsed and normalized on the server. Invalid, empty, or malformed provider responses return a normalized Loadnote error rather than raw upstream content.

Any recommendation load is `weightKg`. Numeric recommendation fields are range-checked. The browser converts kilograms to the current display unit only when rendering.

## No automatic training mutation

Online Coach does not:
- change a workout
- change a training max
- approve a weekly/phase review
- schedule a session
- alter program progression
- write an adaptive decision
- diagnose fatigue, injury, illness, or readiness

The athlete must still use the existing deterministic/reviewed Loadnote workflows for changes.

## Offline behavior

Signed-out and offline athletes retain the built-in deterministic Coach responses and proactive local insights. A provider outage or invalid provider response falls back to built-in guidance rather than blocking training.

## Historical browser keys

Older development builds could store a provider key under `fitness-tracker-api-key` in browser localStorage. v2.63 does not read that value and removes it on client initialization.

The legacy `data.api` object remains tolerated for backward-compatible data loading, but the consumer Coach path ignores it. No schema migration is required.

## Privacy and persistence

The Loadnote backend does not persist Coach prompts/responses into the account store or remote training snapshot in v2.63. The configured external provider processes each request according to that provider's terms and deployment configuration.

Server logs and infrastructure policies remain a deployment responsibility; production operators should avoid logging raw Coach request bodies.

## Remaining production work

v2.63 does not complete:
- concrete App Store/Play Store identity-provider provisioning
- native redirect validation
- multi-instance/persistent AI request rate limiting
- provider-specific enterprise retention controls
- subscription/entitlement enforcement
- production observability/redaction review
