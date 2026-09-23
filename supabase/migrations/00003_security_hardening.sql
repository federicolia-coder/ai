-- Security hardening: set search_path on update_updated_at trigger function
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Prevent users from escalating their own plan via profile update
-- Drop the overly permissive update policy and replace with column-restricted version
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can update own profile safe"
  on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id AND plan = (select plan from profiles where id = auth.uid()));

-- Add content length constraint on messages
alter table messages add constraint messages_content_length check (char_length(content) <= 32000);

-- Add name length constraint on api_keys
alter table api_keys add constraint api_keys_name_length check (char_length(name) <= 100);

-- Add title length constraint on conversations
alter table conversations add constraint conversations_title_length check (char_length(title) <= 200);
