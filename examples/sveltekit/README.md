# AIP Example — SvelteKit

Demonstrates AIP token verification in a SvelteKit application using `@aip/sveltekit`.

## Setup

```bash
pnpm install
pnpm dev
```

## Usage

Add to `src/hooks.server.ts`:

```typescript
import { aipHook } from "@aip/sveltekit";

export const handle = aipHook({
  issuerUrl: "https://registeragent.id",
  audience: "http://localhost:3004",
});
```

Access `event.locals.aipIdentity` in your server routes and load functions.
