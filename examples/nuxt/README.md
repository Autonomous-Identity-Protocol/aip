# AIP Example — Nuxt

Demonstrates AIP token verification in a Nuxt application using `@aip/nuxt`.

## Setup

```bash
pnpm install
pnpm dev
```

## Usage

Add middleware at `server/middleware/aip.ts`:

```typescript
import { createAipEventHandler } from "@aip/nuxt";

export default createAipEventHandler({
  issuerUrl: "https://registeragent.id",
  audience: "http://localhost:3006",
});
```

In your API routes, access `event.context.aipIdentity`:

```typescript
// server/api/me.get.ts
export default defineEventHandler((event) => {
  const identity = event.context.aipIdentity;
  if (!identity) throw createError({ statusCode: 401 });
  return { identity };
});
```
