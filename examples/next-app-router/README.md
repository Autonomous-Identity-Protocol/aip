# AIP Example — Next.js App Router

Demonstrates AIP token verification in a Next.js App Router application using `@aip/next`.

## Setup

```bash
pnpm install
pnpm dev
```

## Endpoints

- `GET /api/me` — Returns entity identity (uses `withAip` wrapper)
- `GET /api/dashboard` — Dashboard data (uses `getAipIdentity` directly)

## Testing

```bash
# Get a token for this app's audience
aip token --aud http://localhost:3001

# Call the protected endpoint
aip call http://localhost:3001/api/me
```
