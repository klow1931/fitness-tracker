# OIDC identity and persistent account store

Loadnote v2.57 connects the v2.56 application-session boundary to a real standards-based identity flow and a durable account record.

The release is deliberately still separate from cloud workout synchronization.

## What v2.57 adds

v2.57 adds:

- generic OpenID Connect discovery
- authorization-code flow
- PKCE (S256)
- cryptographic state and nonce verification
- server-side authorization-code exchange
- RS256 ID-token signature verification against provider JWKS
- issuer, audience, authorized-party, expiration, issued-at and subject validation
- an HttpOnly short-lived sign-in-flow cookie
- durable Loadnote account and provider-identity records
- a minimal consumer account status / sign-in / sign-out surface
- account records surviving server restarts
- protected static serving that does not expose backend source or environment templates

It does not synchronize training history.

## Identity model

The external identity provider proves a provider-specific subject.

Loadnote then resolves:

`provider + provider subject -> Loadnote account`

The provider subject is stored only on the server-side identity mapping.

The consumer-facing account object exposes an opaque Loadnote account ID plus safe profile metadata such as a verified email, display name and provider list.

Email is never the identity key.

Only an email explicitly marked verified by the identity provider is allowed to populate the account email field.

## Account store

The first durable account store is a small atomic JSON file adapter.

It stores:

- account records
- provider-to-account identity mappings
- creation/update/login timestamps
- verified profile metadata

Writes use a temporary file plus rename, and the store file is written with restrictive permissions where the host filesystem supports them.

The account store is validated at backend startup so a malformed/corrupt store fails fast instead of letting authentication proceed against ambiguous identity data.

### Production path

Authenticated production deployments must explicitly configure:

`LOADNOTE_ACCOUNT_STORE_PATH`

The default development path is:

`.loadnote-data/accounts.json`

and is excluded from version control.

### Important scaling boundary

The v2.57 file adapter is appropriate for a **single Loadnote server instance**.

It is not a multi-process or multi-region transactional database.

Before Loadnote runs multiple API instances against the same account data, replace the file adapter with a transactional database implementation behind the same account-store responsibilities.

Do not put the file on a shared filesystem and assume that makes concurrent writes safe.

## OIDC configuration

The backend uses these settings:

```
LOADNOTE_OIDC_ISSUER=
LOADNOTE_OIDC_CLIENT_ID=
LOADNOTE_OIDC_CLIENT_SECRET=
LOADNOTE_OIDC_REDIRECT_URI=
LOADNOTE_OIDC_PROVIDER_ID=
LOADNOTE_OIDC_PROVIDER_NAME=
```

A client secret is optional so public-client providers can use PKCE without one.

When a client secret is present, Loadnote uses a client authentication method advertised by the provider. `client_secret_basic` is preferred; `client_secret_post` is supported as a fallback.

Production issuer and redirect endpoints must use HTTPS.

## Login flow

### 1. Start

The app links to:

`GET /api/auth/login`

The server performs OIDC discovery, then creates:

- random state
- random nonce
- random PKCE verifier
- S256 challenge
- sanitized local return path
- issued-at and expiration timestamps

That flow state is signed and placed in an HttpOnly `SameSite=Lax` cookie scoped to `/api/auth`.

The cookie is short-lived and is separate from the normal application session cookie.

### 2. Identity provider

The browser is redirected to the provider authorization endpoint with:

- response_type=code
- client_id
- redirect_uri
- openid/email/profile scopes
- state
- nonce
- PKCE challenge

### 3. Callback

The provider redirects back to:

`GET /api/auth/callback`

The server verifies:

- the flow cookie exists and is unexpired
- callback state exactly matches
- authorization code exists

The server exchanges the code using the original PKCE verifier.

### 4. ID-token verification

v2.57 accepts RS256 ID tokens.

Loadnote verifies:

- token structure
- RS256 algorithm
- signing-key ID
- signature against the provider JWKS
- issuer
- audience
- authorized party when multiple audiences are present
- expiration
- issued-at time
- nonce
- subject

Signing keys are cached briefly and refreshed once when a token references an unknown key ID so ordinary provider key rotation can succeed.

No ID-token claim is trusted before signature and claim validation finish.

### 5. Account resolution

After verification, the trusted provider subject is resolved against the account store.

An existing identity returns its existing Loadnote account.

A first-time identity creates a new opaque Loadnote account and mapping.

### 6. Application session

The server issues the existing v2.56 signed Loadnote application session and clears the temporary OIDC-flow cookie.

Provider tokens are not copied into localStorage.

The application session remains the authorization source for Loadnote APIs.

## Consumer account UI

Tools now contains a compact Account section.

If a provider is configured and the athlete is signed out, it shows the configured sign-in action.

If signed in, it shows safe account profile information and a sign-out action.

The UI explicitly states that training history is still local in v2.57.

Signing in must not imply that workouts are backed up or synchronized before that functionality exists.

## Provider-neutral architecture

The implementation is OIDC-based rather than hardcoded to one vendor.

A compatible provider can be configured without changing workout or sync schemas.

Provider-specific behavior should be added only when necessary and kept behind the identity-verification boundary.

This keeps Apple, Google, hosted identity services or another reviewed OIDC provider from becoming part of Loadnote's training data model.

## Static-server boundary

Earlier development backend behavior could serve arbitrary repository files under the project root.

v2.57 changes the backend to serve only known consumer root assets plus the `assets/` and `src/` browser directories.

The backend does not web-serve:

- `.env.example`
- backend source
- tests
- documentation
- workflow files
- package metadata
- local account-store files

This is a development/backend hardening measure and should remain in place even behind a production reverse proxy.

## Relationship to v2.55 and v2.56

v2.55 defined how structured training/account data can be compared and safely merged.

v2.56 defined the signed Loadnote session and account-scoped authorization boundary.

v2.57 adds a durable account identity and real provider-verification path.

The next cloud-data milestone can therefore build around:

`verified identity -> Loadnote account -> authenticated request -> account-scoped revision -> v2.55 sync protocol`

The server must continue deriving account scope from the verified Loadnote session rather than accepting a client-supplied account ID.

## Remaining work

v2.57 does not implement:

- cloud workout storage
- automatic multi-device sync
- server revision/base storage
- conflict-resolution UI
- progress-photo upload
- multi-provider account linking
- account deletion/export workflow
- server-side session revocation database
- refresh-token persistence
- password authentication
- multi-instance transactional account storage
- production provider provisioning / store-review configuration

Those should be introduced as explicit milestones.

The key product promise remains accurate:

**Signing in creates a Loadnote account identity. It does not yet mean local training history is synchronized.**
