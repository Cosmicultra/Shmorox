-- =============================================================================
-- Shmorox — full Supabase schema (copy-paste entire file into SQL Editor)
-- Generated from supabase/migrations/*.sql — keep in sync when adding migrations.
-- Last updated: 2026-07-15
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 001_social_connections.sql
-- Per-user social OAuth tokens (LinkedIn, Meta, X, TikTok)
-- -----------------------------------------------------------------------------

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

create index if not exists social_connections_user_id_idx
  on public.social_connections (user_id);

-- -----------------------------------------------------------------------------
-- 002_campaigns.sql
-- Campaign runs (ad cards) per user — JSON metadata; images in Storage
-- -----------------------------------------------------------------------------

create table if not exists public.campaigns (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);
create index if not exists campaigns_user_created_idx on public.campaigns (user_id, created_at desc);

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "Users read own campaigns" on public.campaigns;
create policy "Users read own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own campaigns" on public.campaigns;
create policy "Users insert own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own campaigns" on public.campaigns;
create policy "Users update own campaigns"
  on public.campaigns for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own campaigns" on public.campaigns;
create policy "Users delete own campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 003_campaign_assets_storage.sql
-- Private bucket for rendered ad card images
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('campaign-assets', 'campaign-assets', false, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Campaign assets select own" on storage.objects;
create policy "Campaign assets select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Campaign assets insert own" on storage.objects;
create policy "Campaign assets insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Campaign assets update own" on storage.objects;
create policy "Campaign assets update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Campaign assets delete own" on storage.objects;
create policy "Campaign assets delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- End of schema — add new migration blocks above this line when you add files
-- -----------------------------------------------------------------------------
