# Autonomous Identity Protocol (AIP) — MVP

**Standard:** Autonomous Identity Protocol (AIP)  
**Issuing Authority:** Autonomous Identity Authority (AIA)  
**Registry Portal:** registeragent.id

AIP is a standard for **instant, cryptographic identification of autonomous entities** (agents, autonomous services, bots) on the web. It allows a website to recognize an autonomous entity as a **first-class, logged-in user** without the entity needing to store or use a human password.

---

## 1) Problem

Today, autonomous agents that want to use a web app typically must:

1) Visit a website  
2) Attempt to sign in like a human  
3) Require credentials humans don’t want to share  
4) Only then access the app dashboard

This is brittle, insecure, and blocks the agentic web.

---

## 2) MVP Goal

**A website can identify an autonomous entity and treat it like a normal user, instantly.**

- Agent presents an AIP identity token.
- Website verifies it in ~2 minutes with a copy/paste snippet.
- Website auto-creates a local user row (or links to an existing one).
- Agent can access the dashboard and use the application under that identity.

---

## 3) Non-Goals (MVP)

Not in MVP:

- Payments / spending authorization
- Human approval flows (device codes, consent screens)
- Public directory / search / messaging
- Organization membership / team management
- KYC / legal identity verification beyond basic email verification
- “Account creation automation” across arbitrary websites (form filling etc.)

---

## 4) Core Concepts

### 4.1 Autonomous Entity
Any non-human actor that operates independently and needs a stable identity online.

### 4.2 Owner
A human account that registers and manages autonomous entities in the AIA registry.

### 4.3 Issued Identity Token (“ID card”)
A short-lived cryptographic token issued by AIA that contains identity claims about the autonomous entity.

### 4.4 Registry
AIA maintains the canonical registry of:
- owners
- autonomous entities
- public keys
- status (active/revoked/suspended)
- metadata

Websites do **not** query the registry for every request. They verify tokens locally, and optionally check status.

---

## 5) Standard Naming & Structure

- **AIP**: the standard (specification and interoperability rules)
- **AIA**: the centralized issuer/authority that implements AIP issuance + revocation
- **registeragent.id**: the public portal for registration, keys, docs, and SDK onboarding

This mirrors real internet systems where the protocol and the authority are distinct.

---

## 6) Trust & Security Model

### 6.1 Cryptography (MVP choices)
- Token format: **JWT (JWS-signed)**
- Issuer signing: **ES256 (P-256)** for maximum ecosystem compatibility
- Agent keys: **ES256** (same curve) to simplify libraries across JS frameworks
- Token lifetime: **15 minutes**

### 6.2 Proof-of-Control
Autonomous entities must prove they control the private key bound to their identity.
MVP uses one of:

- **Option A (MVP default):** Short-lived issuer-signed JWT + TLS + audience binding  
- **Option B (recommended upgrade):** DPoP-style proof (token-bound request signature)

MVP MUST include audience binding (see below). DPoP is a “MVP+” feature.

### 6.3 Audience Binding (Required)
All tokens must include:
- `aud = <merchant origin/domain>`

This prevents token replay across different websites.

---

## 7) Identity Claims (MVP)

AIA issues an **AIP ID Token** with these required claims:

- `iss` (string): issuer identifier (AIA)
- `sub` (string): autonomous entity ID (stable)
- `aud` (string): merchant audience (origin/domain)
- `iat` (number): issued at
- `exp` (number): expiry (15 minutes)

Required AIP custom claims:

- `aip_entity_name` (string): display name of entity
- `aip_owner_id` (string): stable owner ID
- `aip_owner_display_name` (string): owner display name
- `aip_owner_email` (string): owner email (MVP default: always included)

Optional:

- `aip_metadata` (object): small metadata blob (max **2KB** when serialized)
- `aip_assurance` (string): e.g. `basic` (reserved for future tiers)

---

## 8) Registry Data Model (MVP)

### 8.1 Owner
- `owner_id` (primary key)
- `email` (verified required)
- `display_name`
- `created_at`
- `status` (active/suspended)

### 8.2 Autonomous Entity
- `entity_id` (primary key)
- `owner_id` (foreign key)
- `entity_name`
- `public_key_jwk` (current active key)
- `status` (active/revoked/suspended)
- `metadata` (json)
- `created_at`
- `last_key_rotation_at`

### 8.3 Issuer Keys
- `kid`
- `public_jwk`
- `active`
- `created_at`
- rotation policy

---

## 9) Required Endpoints (AIA)

All endpoints are hosted under registeragent.id (or a dedicated API domain), but branded as AIA.

### 9.1 Well-known discovery (issuer)
`GET /.well-known/aip-issuer`
Returns:
- `issuer` (iss value)
- `jwks_uri`
- `token_endpoint`
- `status_endpoint`
- supported algorithms
- token ttl
- required claims list

### 9.2 JWKS
`GET /.well-known/jwks.json`
Public keys for verifying AIA-issued JWTs.

### 9.3 Token issuance (agent → AIA)
`POST /oauth/token` (naming can be OAuth-ish for familiarity)

MVP issuance method: **Client Assertion**
- entity signs an assertion JWT with its private key
- AIA verifies assertion against registered public key
- AIA returns ID token bound to the requested audience

Request includes:
- `grant_type=client_credentials` (or `urn:ietf:params:oauth:grant-type:jwt-bearer`)
- `client_assertion` (signed by entity key)
- `client_assertion_type`
- `audience` (merchant origin/domain)

Response:
- `id_token` (AIP ID token)
- `expires_in`
- optionally `token_type=Bearer`

### 9.4 Status / revocation check
`GET /status?sub=<entity_id>`
Returns:
- `status`: active/revoked/suspended
- `updated_at`

Merchants may call this:
- on first login
- periodically (cached)
- on high-risk actions

### 9.5 Owner + entity management
Owner-authenticated (dashboard + API):

- `POST /v1/entities` create entity (register public key, name, metadata)
- `GET /v1/entities` list
- `PATCH /v1/entities/:id` update name/metadata
- `POST /v1/entities/:id/rotate-key` rotate key
- `POST /v1/entities/:id/revoke` revoke
- `POST /v1/entities/:id/suspend` suspend

Owner authentication for the dashboard/API is implementation detail (email + passkey recommended).

---

## 10) Merchant Integration (The “2-Minute Setup”)

A merchant can integrate AIP in two ways:

### 10.1 Integration Mode 1 — Middleware Verification (MVP default)
Most developers want: “verify token, get identity object”.

Deliver:
- `@aip/verify` core library
- framework wrappers:
  - `@aip/next`
  - `@aip/express`
  - `@aip/sveltekit`
  - `@aip/remix`
  - `@aip/nuxt`

Merchant receives requests with:
- `Authorization: Bearer <AIP_ID_TOKEN>`

The middleware:
1) Extracts JWT
2) Validates signature using JWKS
3) Validates `iss`, `aud`, `exp`
4) Optionally checks `/status` (cached)
5) Returns normalized identity:
   - `entity_id`, `entity_name`
   - `owner_id`, `owner_display_name`, `owner_email`
   - `assurance`, `issuer`

Merchant then:
- auto-creates a local user row (if missing)
- creates a session / issues cookie / maps to existing auth model

### 10.2 Integration Mode 2 — “OIDC-compatible provider” (MVP optional)
For platforms like Supabase/NextAuth that can add an identity provider, AIA can expose OIDC-shaped endpoints.
This is optional in MVP but recommended for adoption.

---

## 11) Merchant Auto-User Creation Rules (MVP)

When a valid AIP identity is received:
- Find local user by `entity_id` (preferred), else by `(owner_email + entity_name)` for recovery.
- If missing, create user row:
  - `type = "autonomous"`
  - `entity_id`
  - `display_name = entity_name`
  - `email = owner_email` (or store as `owner_email`)
  - `owner_id`, `owner_display_name`

This makes the entity behave like a first-class user immediately.

---

## 12) Merchant Discovery Endpoint (Optional but recommended)

To let autonomous entities detect support automatically, merchants can expose:

`GET /.well-known/aip`
Returns:
- `issuer` (AIA issuer URL)
- `audience` (what the merchant expects in `aud`)
- supported auth methods (bearer, dpop)
- optional app hints

Autonomous entities can:
1) Check `/.well-known/aip`
2) Request token for `audience`
3) Call the app with `Authorization: Bearer <token>`

---

## 13) Framework Support (MVP Deliverables)

### Must-have examples
- Next.js (App Router)
- Next.js (Pages Router)
- Express
- SvelteKit
- Remix
- Nuxt

Each example must show:
- installing the package
- verifying token
- auto-creating user
- starting a session (cookie) or passing identity through request context

### SDK UX requirement
Every framework wrapper must offer:
- one function call
- one clear return object
- clear errors (invalid token, wrong aud, expired, revoked)

---

## 14) Supabase & Firebase Paths (MVP-ready design, full support later)

### Supabase (recommended MVP approach)
- Verify AIP token server-side
- Create/link Supabase user row using service role
- Issue Supabase session or map identity to RLS claims later

Ship an example:
- `examples/supabase-aip-verify`

### Firebase (recommended future approach)
- Verify AIP token server-side
- Mint Firebase custom token (admin SDK) with `uid = entity_id`
- Set custom claims (owner_id)

Keep the token claims designed to support this cleanly.

---

## 15) Owner Onboarding (Portal + API)

AIA must provide:
- Dashboard UI at registeragent.id for:
  - sign up
  - verify email
  - create entity
  - generate “integration snippet”
  - rotate/revoke keys
- API for the same actions (for programmatic entity creation)

---

## 16) “Agent Skill” Package (MVP requirement)

Provide an installable “skill” / reference client behavior for autonomous entities:

### What it must do
- Detect AIP support:
  - check `/.well-known/aip` on a target website
- If supported:
  - request an audience-bound token from AIA
  - call the website with `Authorization: Bearer <token>`
- Handle refresh:
  - refresh token every ~10 minutes
- Expose a simple function:
  - `getAipTokenFor(origin)`
  - `callWithAip(url, options)`

### Deliverables
- `@aip/client` (TypeScript)
- CLI tool:
  - `aip register`
  - `aip token --aud <origin>`
  - `aip call <url>`

---

## 17) Security & Abuse Posture (MVP)

Required:
- Email verification for owners
- Rate limiting on `/oauth/token`
- Rate limiting and abuse detection on entity creation
- Key rotation support
- Entity revocation/suspension
- Short-lived tokens (15m)
- Audience binding enforced

Recommended:
- Optional DPoP / request-bound proofs (MVP+)
- IP / ASN abuse heuristics for token issuance
- Audit logging (issuance events, revocations)

---

## 18) MVP Build Checklist

### A) AIA (Authority backend)
- [ ] Owner auth + email verification
- [ ] Entity registration + store public key
- [ ] Issuer key management + JWKS
- [ ] Token issuance endpoint (client assertion)
- [ ] Status endpoint (revocation/suspension)
- [ ] Admin ops: revoke/suspend entities, rotate keys

### B) Portal (registeragent.id)
- [ ] Create account
- [ ] Create entity
- [ ] Show entity_id + “how to use” instructions
- [ ] Show copy/paste merchant snippet
- [ ] Key rotation/revocation UI
- [ ] Docs landing: “Implement AIP in 2 minutes”

### C) SDKs + Examples (TypeScript first)
- [ ] Core verify lib `@aip/verify`
- [ ] Next.js wrappers (App + Pages)
- [ ] Express middleware
- [ ] SvelteKit hook
- [ ] Remix loader/action helper
- [ ] Nuxt server middleware
- [ ] Examples for each framework

### D) Agent client
- [ ] `@aip/client` + CLI
- [ ] `/.well-known/aip` discovery helper
- [ ] Token caching + refresh

---

## 19) Copy Text (Landing/README)

### One-liner
**AIP is the standard for instant identity and login for autonomous entities on the web.**

### Short pitch
Autonomous entities shouldn’t need passwords. With AIP, an entity presents a short-lived identity token issued by the Autonomous Identity Authority (AIA). Your app verifies it and instantly treats the entity as a logged-in user.

### Developer promise
**Integrate in 2 minutes. Verify one token. Get a user identity object.**

---

## 20) Governance & Branding (MVP stance)

- AIP is the open standard name.
- AIA is the centralized issuing authority implementing AIP.
- registeragent.id is the official registry portal and documentation home.

---

## 21) Licensing Recommendation (so you don’t leave empty-handed)

To keep “standard adoption” high while preserving monetization:

- **AIP spec + SDKs:** MIT (or Apache-2.0)
- **AIA issuer implementation:** hosted service first; open-source optional later

This matches how many “standards” succeed commercially:
open client + open docs, while the authority provides a reliable canonical service.

---

## 22) MVP+ Roadmap (Next after MVP)

- DPoP / request-bound proof
- Organization owners + members
- Assurance tiers (`basic`, `verified_email`, `verified_org`)
- Public directory (opt-in)
- Federation (multiple authorities) if the ecosystem demands it
- Payment/spending authorization extensions (separate standard)

---

## 23) Success Criteria (MVP)

MVP is done when:
- A brand-new Next.js app can add AIP verification in < 2 minutes
- An autonomous entity can register, get a token, and access a dashboard without passwords
- Revocation works and is respected by merchants
- Examples exist for Next.js, Express, SvelteKit, Remix, Nuxt