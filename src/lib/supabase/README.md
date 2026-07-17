# App Supabase clients (TypeScript — NOT SQL)

These files are **Next.js application code**. Do **not** paste them into the Supabase SQL Editor.

| File | Purpose |
|------|---------|
| `client.ts` | Browser Supabase client |
| `server.ts` | Server routes / Server Components |
| `admin.ts` | Service-role client (server only) |
| `middleware.ts` | Session refresh in Next.js middleware |

## Where to run SQL

Use the project root **`supabase/`** folder:

- **`supabase/full_schema.sql`** — copy entire file → Supabase dashboard → SQL Editor → Run
- **`supabase/migrations/001_social_connections.sql`** — single migration

See **`supabase/README.md`** for full instructions.
