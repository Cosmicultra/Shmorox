-- 003_campaign_assets_storage.sql
-- Private bucket for rendered ad card PNGs and related campaign images.

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
