# Autonomous Identity Protocol (AIP)

**The standard for instant identity and login for autonomous entities on the web.**

AIP lets autonomous entities (AI agents, bots, autonomous services) authenticate with any website using short-lived cryptographic identity tokens — no passwords, no OAuth dance, no human intervention.

## How It Works

```
Agent                    AIA (registeragent.id)              Merchant App
  |                            |                                |
  |-- sign assertion JWT ----->|                                |
  |<-- AIP ID Token ----------|                                |
  |                            |                                |
  |-- Bearer <token> ----------------------------------------->|
  |                            |    verify with @aip/verify     |
  |<------------------------------------------ 200 OK ---------|
```

1. Agent signs a client assertion with its private key
2. AIA verifies and issues a short-lived ID token (15 min, audience-bound)
3. Agent presents the token to any supporting website
4. Website verifies the token and treats the agent as a logged-in user

## Packages

| Package | Description |
|---------|-------------|
| [`@aip/core`](packages/core) | Shared types, constants, error classes, Zod schemas |
| [`@aip/verify`](packages/verify) | Token verification library (works in any JS runtime) |
| [`@aip/next`](packages/next) | Next.js middleware and helpers |
| [`@aip/express`](packages/express) | Express middleware |
| [`@aip/sveltekit`](packages/sveltekit) | SvelteKit server hook |
| [`@aip/remix`](packages/remix) | Remix loader helpers |
| [`@aip/nuxt`](packages/nuxt) | Nuxt server middleware |
| [`@aip/client`](packages/client) | Agent-side client with token caching |
| [`@aip/cli`](packages/cli) | CLI tool for registration and token management |

## Quick Start

### Verify agent tokens (for app developers)

```bash
npm install @aip/verify
```

```typescript
import { createAipVerifier } from "@aip/verify";

const verifier = createAipVerifier({
  issuerUrl: "https://registeragent.id",
});

// In your API route:
const token = request.headers.get("Authorization")?.replace("Bearer ", "");
const identity = await verifier.verify(token, {
  audience: "https://your-app.com",
});

console.log(identity.entityId);
console.log(identity.entityName);
console.log(identity.ownerEmail);
```

### Register an agent (for agent developers)

Send this to your AI agent:

> Read https://registeragent.id/skill and follow the instructions to register yourself.

Or use the client library:

```typescript
import { AipClient } from "@aip/client";

const client = new AipClient({
  entityId: "your-entity-uuid",
  privateKeyJwk: { /* your private key */ },
});

const response = await client.fetch("https://merchant.com/api/data");
```

## Examples

See the [`examples/`](examples) directory for complete integration examples:

- [Next.js App Router](examples/next-app-router)
- [Express](examples/express)
- [Supabase](examples/supabase)
- [SvelteKit](examples/sveltekit)
- [Remix](examples/remix)
- [Nuxt](examples/nuxt)

## Specification

The full protocol specification is in [`spec.md`](spec.md).

## Registry

Register and manage entities at [registeragent.id](https://registeragent.id).

## License

MIT
