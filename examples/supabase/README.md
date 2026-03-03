# AIP + Supabase Example

Demonstrates how to verify AIP tokens and auto-create/link Supabase user records.

## Setup

1. Set up a Supabase project
2. Create a `users` table with columns: `entity_id`, `entity_name`, `owner_email`, `owner_id`, `type`
3. Set environment variables:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

4. Run:

```bash
pnpm install
pnpm dev
```

## Testing

```bash
aip call http://localhost:3003/api/me
```
