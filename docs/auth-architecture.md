# Account identity and authentication foundation

> **v2.57 update:** The provider-verification and durable-account steps anticipated by this v2.56 document are now implemented through generic OIDC plus the file-backed single-instance account store. See `docs/oidc-account-store.md` for the current flow and its scaling boundary. The session/CSRF rules below remain authoritative.

> **v2.58 update:** Account-scoped remote structured-training snapshot endpoints now reuse this authenticated session boundary. The server derives storage scope from the verified session and never trusts a client-supplied account ID. See `docs/remote-training-storage.md`.

> **v2.60 update:** authenticated consumers can delete their Loadnote account with `DELETE /api/account`. Cookie-authenticated deletion requires CSRF. The server removes the account-scoped remote training snapshot first, then deletes the account and all provider-identity mappings, and clears the web session cookie. Local device training is not part of this server-side deletion.

> **v2.63 update:** production online Coach always requires an authenticated Loadnote account even if a deployment relaxes the general account requirement. The browser no longer owns provider credentials/configuration or the trusted Coach prompt. See `docs/coach-production.md`.

Loadnote v2.56 establishes the server-side identity/session boundary that later commercial account and cloud-sync work can build on.

This release does **not** add a production identity provider or consumer sign-in screen yet. It intentionally separates:

1. **Identity verification** — a trusted provider proves who the user is.
2. **Loadnote account identity** — the provider + provider subject map to a stable Loadnote account ID.
3. **Loadnote session** — the server issues a short-lived signed session after trusted identity verification.
4. **Protected application APIs** — account-scoped endpoints require a valid Loadnote session.

That separation lets later Apple/Google/email authentication be added without coupling workout history, sync, or Coach APIs directly to a specific provider.

## Stable Loadnote account identity

A trusted server-side identity is represented by:

- provider
- provider subject

In v2.56 the session primitive could derive a deterministic opaque identity for testing the boundary. In v2.57, the persistent account store becomes the authority: provider + provider subject resolve to a durable Loadnote account record with its own opaque account ID.

The Loadnote account ID is independent of the session-signing secret, so routine session-key rotation does not silently create a new account identity.

Email addresses are **not** treated as the account identity key. Email addresses can change, can be hidden by providers, and should not be trusted as a globally stable account identifier.

Future account linking across identity providers will require explicit linking rules that attach another verified provider identity to the existing Loadnote account.

## Session model

The first Loadnote application session is:

- versioned
- audience-bound to Loadnote
- short-lived
- signed server-side with HMAC-SHA256
- issued with a unique session ID
- associated with one Loadnote account ID
- associated with the verified identity provider
- given an expiration timestamp
- given a random CSRF token

Web sessions are delivered through an HttpOnly cookie.

The browser does not store the session token in localStorage.

The client only keeps the non-secret account/session status and CSRF token in memory.

The current default lifetime is 12 hours and is configurable up to 30 days.

## Cookie security

The session cookie uses:

- HttpOnly
- Path=/
- SameSite=Strict by default
- Secure by default when NODE_ENV=production

`SameSite=None` is rejected unless Secure cookies are enabled.

A future identity-provider callback may need a separate short-lived state/PKCE cookie with different SameSite behavior. The normal application session should remain as restrictive as practical.

## CSRF

Cookie-authenticated state-changing requests require the session's CSRF value in:

`X-Loadnote-CSRF`

The browser account-session client automatically adds this header to authenticated non-GET requests.

Bearer-authenticated requests do not require CSRF because browsers do not attach bearer credentials automatically. Bearer session support exists at the server primitive layer for future native-client work, but v2.56 does not expose a consumer bearer-login flow or persistent token storage.

## Production defaults

When `NODE_ENV=production`, Loadnote now treats authenticated backend access as required unless explicitly overridden with:

`LOADNOTE_REQUIRE_AUTH=0`

If production auth is required but `LOADNOTE_AUTH_SECRET` is missing or shorter than 32 bytes, the backend refuses to start.

This prevents accidentally deploying the commercial backend with protected endpoints silently running in anonymous mode.

For production, use a high-entropy random `LOADNOTE_AUTH_SECRET` and treat rotation as a session invalidation event.

## Cross-origin access

Authenticated cross-origin requests are no longer served with `Access-Control-Allow-Origin: *`.

Allowed behavior is:

- same-host browser origins are accepted
- origins listed in `LOADNOTE_ALLOWED_ORIGINS` are accepted
- other supplied origins are rejected

Credentialed responses echo the accepted origin and include `Access-Control-Allow-Credentials: true`.

A future native build that calls a separate production API origin must explicitly configure its Capacitor/WebView origin in `LOADNOTE_ALLOWED_ORIGINS`.

## Account endpoints

### GET /api/auth/session

Returns the current account-session state without exposing the signed session token.

Authenticated cookie sessions return:

- authenticated
- account ID
- provider
- expiration
- CSRF token
- transport

Anonymous or unconfigured sessions return a non-authenticated status.

### POST /api/auth/logout

Clears the web session cookie.

Cookie-authenticated logout requests require CSRF.

For a future bearer-token client, logout also requires the client to discard its bearer credential until server-side revocation storage is introduced.

### GET /api/account

Always requires a valid Loadnote session.

This is the account-scoped protected read endpoint.

### DELETE /api/account

Deletes the authenticated Loadnote account and its server-side synced structured training. Cookie-authenticated requests require CSRF. Provider-identity mappings attached to the account are removed, the session cookie is cleared, and the old session stops resolving because the account no longer exists. Local browser/native training data is deliberately not erased by this server endpoint.

## Coach protection

The Coach proxy uses the same account session. In production, Coach authentication is always required even if a deployment explicitly relaxes the general account requirement.

For online Coach:

- anonymous Coach POST requests receive 401
- authenticated cookie requests without CSRF receive 403
- only an authenticated/verified request proceeds to the upstream AI-provider boundary

The AI provider key, provider/model configuration, trusted system prompt, upstream error payloads and provider-response parsing remain server-side. The client may send only its question, bounded recent user/assistant history and structured Loadnote context. Raw provider-style messages and client provider/model/key configuration are rejected.

The existing deterministic/offline Coach remains available to the app when signed out, offline, or when the online provider is unavailable.

## Development-only session issuer

v2.56 includes:

`POST /api/auth/dev-session`

This route exists only to exercise the real session/account boundary during development and automated tests.

It is available only when all of the following are true:

- `NODE_ENV` is not `production`
- `LOADNOTE_DEV_AUTH=1`
- `LOADNOTE_DEV_AUTH_KEY` is configured
- normal account auth is configured

The request must include the development key in:

`X-Loadnote-Dev-Auth`

The development issuer is forcibly disabled in production even if the environment flag is accidentally present.

It is **not** a consumer login mechanism and must never be represented as one.

## Consumer UI boundary

v2.56 does not add a fake sign-in screen.

It also removes the exposed backend-URL/backend-toggle controls that had leaked into the consumer food-entry UI.

Normal consumer requests use the configured Loadnote backend contract.

v2.63 removes active browser BYO-key/provider plumbing from the consumer Coach path. Historical browser Coach keys are scrubbed on upgrade. Development provider configuration now belongs at the server/environment boundary rather than in production-facing UI.

## Identity-provider integration (implemented in v2.57)

v2.57 adds a provider-neutral OIDC implementation. Production deployment still requires provisioning and reviewing a concrete compatible identity provider.

That provider integration should:

1. start an authorization request with strong state and PKCE protection where applicable
2. validate the provider response server-side
3. validate issuer, audience, expiration and nonce/state requirements
4. extract the trusted provider subject
5. map provider + subject to the stable Loadnote account identity
6. issue the existing Loadnote application session
7. redirect/return to the application without exposing provider secrets to client code

The provider token should not become the internal identifier for workouts or sync records.

## Relationship to v2.55 sync

v2.55 defined **what** structured data can be safely compared and merged.

v2.56 defined the signed account-session authorization boundary.

v2.57 adds the verified OIDC identity path and durable account mapping.

A future cloud-sync milestone can combine those layers:

- authenticated account identity
- account-scoped server revision
- v2.55 sync package/manifest
- three-way merge against a known shared base
- atomic account-scoped commit

The server must never accept a client-supplied account ID as authorization on its own. Account scope must come from the verified Loadnote session.

## Still not completed after v2.57

This release does not implement:

- provider-specific provisioning / store-review configuration where required
- password storage
- password reset
- account recovery
- multi-instance transactional account database (v2.57 currently uses a durable single-instance file adapter)
- server-side session revocation store
- refresh tokens
- account linking
- cloud sync transport
- remote workout storage
- subscriptions
- production account-management UI

Those should remain separate reviewed milestones.

The purpose of v2.56 is to create a secure, testable identity/session boundary before attaching real consumer identity providers and cloud data to it.
