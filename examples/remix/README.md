# AIP Example — Remix

Demonstrates AIP token verification in a Remix application using `@aip/remix`.

## Setup

```bash
pnpm install
pnpm dev
```

## Usage

In your loader:

```typescript
import { getAipIdentity, requireAipIdentity } from "@aip/remix";

const config = {
  issuerUrl: "https://registeragent.id",
  audience: "http://localhost:3005",
};

export async function loader({ request }: LoaderFunctionArgs) {
  const identity = await requireAipIdentity(request, config);
  return json({ user: identity });
}
```
