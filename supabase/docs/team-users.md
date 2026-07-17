# Adding team members (email + password)

There is **no public sign-up** in the app. You (the admin) create each account in Supabase, then add their email to `NEXT_PUBLIC_ALLOWED_EMAILS` in `.env.local` / Vercel.

## 1. Disable public sign-ups (recommended)

Supabase dashboard → **Authentication** → **Settings**:

- Turn **off** “Allow new users to sign up” (if shown)

Only accounts you create manually can log in.

## 2. Enable email + password

**Authentication** → **Providers** → **Email**:

- **Enabled**
- For a small internal team, you can turn **off** “Confirm email” so people can log in immediately after you create them

## 3. Create a user

**Authentication** → **Users** → **Add user** → **Create new user**

| Field | What to enter |
|-------|----------------|
| Email | Their login email |
| Password | Temporary password (share securely; they can change it later in Supabase if needed) |
| Auto Confirm User | **On** (if you disabled email confirmation) |

Click **Create user**.

Repeat for each teammate (3–4 people).

## 4. Allowlist in the app

In `.env.local` (and Vercel env vars when deployed):

```env
NEXT_PUBLIC_ALLOWED_EMAILS=alice@company.com,bob@company.com,carol@company.com
```

Only these emails can use the app, even if someone else had a Supabase account.

Restart the dev server after changing env vars.

## 5. Teammate logs in

1. Open the app → **Sign in**
2. Enter the email and password you gave them
3. They land on the Command Center

## Reset a password

Supabase dashboard → **Authentication** → **Users** → select user → **Send password recovery** or set a new password from the user detail panel.

## Remove access

1. Remove their email from `NEXT_PUBLIC_ALLOWED_EMAILS` and redeploy / restart
2. Optionally delete the user in **Authentication** → **Users**
