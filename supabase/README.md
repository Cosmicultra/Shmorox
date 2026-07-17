# Supabase schema & migrations

SQL changes for the Shmorox Supabase project. Run these in the Supabase dashboard **SQL Editor** (or via Supabase CLI if you add it later).

## Quick copy-paste (everything at once)

Use **`full_schema.sql`** when you want one file to run in SQL Editor — e.g. fresh project or “apply everything current.”

## Incremental migrations

Run files in **`migrations/`** in numeric order. Each file is idempotent where possible (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.) so re-running is usually safe.

| File | Purpose |
|------|---------|
| `001_social_connections.sql` | Per-user OAuth tokens for LinkedIn, Meta, X, TikTok |
| `002_campaigns.sql` | Campaign/ad card metadata (JSON per user) |
| `003_campaign_assets_storage.sql` | Private Storage bucket for rendered ad images |

When you add a feature that needs database changes:

1. Create the next numbered file, e.g. `002_campaigns.sql`
2. Append the same SQL to the bottom of `full_schema.sql` (with a section comment)
3. Update this README table

## Auth (no SQL required)

Configure in the Supabase **dashboard** — see **`docs/team-users.md`** for step-by-step user setup.

- **Email + password:** Authentication → Providers → Email (enabled)
- **Create users:** Authentication → Users → Add user (admin creates each account)
- **Disable public sign-up:** Authentication → Settings → turn off new sign-ups
- **Team allowlist:** App env var `NEXT_PUBLIC_ALLOWED_EMAILS` in `.env.local` / Vercel

## Local env vars (reference)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ALLOWED_EMAILS=alice@company.com,bob@company.com
```

## Verify after running SQL

1. **Table Editor** → `social_connections` exists  
2. **Authentication** → Email provider enabled  
3. At least one user created under **Authentication** → **Users**  
4. App login works with allowlisted email + password
