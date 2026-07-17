-- 001_social_connections.sql
-- Per-user social OAuth tokens (LinkedIn first; same table for Meta, X, TikTok).
-- Requires: Supabase Auth (auth.users) already enabled.

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('linkedin', 'instagram', 'x', 'tiktok')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  platform_user_id text,
  account_name text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists social_connections_updated_at on public.social_connections;
create trigger social_connections_updated_at
  before update on public.social_connections
  for each row execute function public.set_updated_at();

alter table public.social_connections enable row level security;

drop policy if exists "Users read own connections" on public.social_connections;
create policy "Users read own connections"
  on public.social_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own connections" on public.social_connections;
create policy "Users insert own connections"
  on public.social_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own connections" on public.social_connections;
create policy "Users update own connections"
  on public.social_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own connections" on public.social_connections;
create policy "Users delete own connections"
  on public.social_connections for delete
  using (auth.uid() = user_id);

-- Optional: index for lookups by user (RLS still applies)
create index if not exists social_connections_user_id_idx
  on public.social_connections (user_id);
