# Account identity and authentication foundation

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

Loadnote derives a stable opaque account ID from those two values.

The Loadnote account ID is intentionally independent of the session-signing secret so routine session-key rotation does not silently create a new account identity.

Email addresses are **not** treated as the account identity key. Email addresses can change, can be hidden by providers, and should not be trusted as a globally stable account identifier.

Future account linking across identity providers will require explicit server-side account records and linking rules.

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

This is the first account-scoped protected endpoint and establishes the server authorization boundary that future sync/account resources should reuse.

## Coach protection

The Coach proxy can now operate behind the same account session.

When authentication is required:

- anonymous Coach POST requests receive 401
- authenticated cookie requests without CSRF receive 403
- only an authenticated/verified request proceeds to the upstream AI-provider boundary

The AI provider key remains server-side.

The existing deterministic/offline Coach remains available to the app if the online backend is unavailable.

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

Development provider/BYO-key plumbing may remain in code for local development, but it should not appear as normal consumer product configuration.

## Future identity-provider integration

A later release can add a production provider such as Apple, Google, or another reviewed identity service.

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

v2.56 defines **who** an authenticated server request belongs to.

A future cloud-sync milestone can combine those two layers:

- authenticated account identity
- account-scoped server revision
- v2.55 sync package/manifest
- three-way merge against a known shared base
- atomic account-scoped commit

The server must never accept a client-supplied account ID as authorization on its own. Account scope must come from the verified Loadnote session.

## Not completed in v2.56

This release does not implement:

- Apple/Google/email production sign-in
- password storage
- password reset
- account recovery
- persistent server-side account database
- server-side session revocation store
- refresh tokens
- account linking
- cloud sync transport
- remote workout storage
- subscriptions
- production account-management UI

Those should remain separate reviewed milestones.

The purpose of v2.56 is to create a secure, testable identity/session boundary before attaching real consumer identity providers and cloud data to it.
