-- 002_campaigns.sql
-- Campaign runs (ad cards pipeline state) per authenticated user.
-- Large image blobs live in Supabase Storage (campaign-assets bucket), not in JSON.

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
