-- Attachments: private bucket for chat uploads (images + documents, never video).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own attachments" on storage.objects;
drop policy if exists "Users can read own attachments" on storage.objects;
drop policy if exists "Users can delete own attachments" on storage.objects;

create policy "Users can upload own attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- An attachment row may only point at a conversation the user owns.
drop policy if exists "Users can insert own attachments" on public.attachments;
create policy "Users can insert own attachments"
  on public.attachments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create index if not exists attachments_conversation_idx on public.attachments (conversation_id, created_at desc);

-- Connectors: stable slug, the runtime tools each one unlocks, and availability.
alter table public.connectors add column if not exists slug text;
alter table public.connectors add column if not exists tools text[] not null default '{}';
alter table public.connectors add column if not exists available boolean not null default true;

update public.connectors set
  slug = 'github',
  tools = '{github_repos,github_issues,github_file}',
  description = 'Leggi i tuoi repository, le issue e i file del codice',
  config_schema = '{"fields":[{"name":"token","type":"password","label":"Personal Access Token","required":true,"help":"Crealo su github.com/settings/tokens con permesso di sola lettura sui repository."}]}'
where name = 'GitHub';

update public.connectors set
  slug = 'notion',
  tools = '{notion_search,notion_page}',
  description = 'Cerca e leggi le pagine del tuo workspace Notion',
  config_schema = '{"fields":[{"name":"api_key","type":"password","label":"Internal Integration Secret","required":true,"help":"Crea un''integrazione su notion.so/profile/integrations, poi condividi con lei le pagine che Tarry deve vedere."}]}'
where name = 'Notion';

update public.connectors set
  slug = 'webhook',
  tools = '{webhook_send}',
  description = 'Fai inviare a Tarry messaggi a un tuo endpoint HTTPS',
  config_schema = '{"fields":[{"name":"url","type":"url","label":"URL del webhook","required":true,"help":"Deve essere https. Riceverà un POST JSON di prova al salvataggio."},{"name":"secret","type":"password","label":"Secret per la firma","required":false,"help":"Opzionale. Se impostato, ogni richiesta ha l''header X-Tarry-Signature (HMAC-SHA256)."}]}'
where name = 'Webhook';

update public.connectors set
  slug = 'google_drive',
  tools = '{}',
  available = false
where name = 'Google Drive';

alter table public.connectors alter column slug set not null;
create unique index if not exists connectors_slug_key on public.connectors (slug);

-- User connectors: credentials are write-only from the browser.
-- Only the connectors edge function (service role) writes config and the chat function reads it.
alter table public.user_connectors
  add column if not exists configured boolean generated always as (config <> '{}'::jsonb) stored;

revoke all on public.user_connectors from anon, authenticated;
grant select (id, user_id, connector_id, enabled, configured, created_at, updated_at)
  on public.user_connectors to authenticated;
grant update (enabled, updated_at) on public.user_connectors to authenticated;
grant delete on public.user_connectors to authenticated;

drop policy if exists "Users can insert own connector configs" on public.user_connectors;

-- Plugins: tool names must match what the runtime registers.
update public.plugins set
  tools = '{read_file,search_files}',
  permissions = '{files.read}',
  description = 'Legge e cerca nei file che alleghi alla chat (testo, CSV, JSON, PDF, Word, Excel)',
  enabled_by_default = true
where name = 'files';

update public.plugins set description = 'Cerca sul web notizie e informazioni aggiornate' where name = 'web_search';
update public.plugins set description = 'Esegue calcoli matematici esatti' where name = 'calculator';
update public.plugins set description = 'Chiama API pubbliche esterne con richieste HTTP GET o POST' where name = 'http';
