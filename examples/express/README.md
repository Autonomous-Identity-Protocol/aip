# AIP Example — Express

Demonstrates AIP token verification in an Express application using `@aip/express`.

## Setup

```bash
pnpm install
pnpm dev
```

## Endpoints

- `GET /api/me` — Returns entity identity
- `GET /api/data` — Protected sample data

## Testing

```bash
aip token --aud http://localhost:3002
aip call http://localhost:3002/api/me
```
