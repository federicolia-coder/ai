-- Lists every stored file of a user so account deletion can remove them through the Storage API
-- (rows in storage.objects cannot be deleted directly). Service role only.
create or replace function public.user_storage_paths(p_user_id uuid)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path to ''
as $$
  select o.bucket_id, o.name
  from storage.objects o
  where o.bucket_id in ('attachments', 'uploads')
    and o.name like p_user_id::text || '/%';
$$;

revoke execute on function public.user_storage_paths(uuid) from public, anon, authenticated;
grant execute on function public.user_storage_paths(uuid) to service_role;
