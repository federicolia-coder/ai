-- Create uploads storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  10485760, -- 10MB
  array[
    'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/yaml',
    'application/json', 'application/xml', 'application/pdf',
    'application/x-yaml'
  ]
)
on conflict (id) do nothing;

-- RLS: users can upload to their own folder
create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can read their own files
create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
