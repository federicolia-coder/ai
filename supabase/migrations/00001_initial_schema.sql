-- Tarry AI — Initial Database Schema

-- Plan enum
create type plan_type as enum ('free', 'plus', 'pro');

-- Message role enum
create type message_role as enum ('system', 'user', 'assistant', 'tool');

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  plan plan_type not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id, plan, status, token_limit)
  values (new.id, 'free', 'active', 100000);

  insert into public.usage (user_id, period_start, period_end, tokens_used, token_limit)
  values (
    new.id,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    0,
    100000
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;

create policy "Users can read own conversations"
  on conversations for select using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on conversations for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on conversations for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on conversations for delete using (auth.uid() = user_id);

create index idx_conversations_user on conversations(user_id, updated_at desc);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role message_role not null,
  content text not null,
  token_count int not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users can read own messages"
  on messages for select using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on messages for insert with check (auth.uid() = user_id);

create index idx_messages_conversation on messages(conversation_id, created_at);

-- Usage
create table usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  tokens_used bigint not null default 0,
  token_limit bigint not null default 100000,
  created_at timestamptz not null default now(),
  unique(user_id, period_start)
);

alter table usage enable row level security;

create policy "Users can read own usage"
  on usage for select using (auth.uid() = user_id);

create index idx_usage_user_period on usage(user_id, period_start desc);

-- Atomic token increment — prevents race conditions
create or replace function public.increment_token_usage(
  p_user_id uuid,
  p_tokens int
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_remaining bigint;
begin
  update public.usage
  set tokens_used = tokens_used + p_tokens
  where user_id = p_user_id
    and period_start <= now()
    and period_end > now()
    and tokens_used + p_tokens <= token_limit
  returning (token_limit - tokens_used) into v_remaining;

  return found;
end;
$$;

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan plan_type not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  token_limit bigint not null default 100000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select using (auth.uid() = user_id);

create index idx_subscriptions_stripe on subscriptions(stripe_customer_id);

-- API Keys
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;

create policy "Users can read own API keys"
  on api_keys for select using (auth.uid() = user_id);

create policy "Users can insert own API keys"
  on api_keys for insert with check (auth.uid() = user_id);

create policy "Users can delete own API keys"
  on api_keys for delete using (auth.uid() = user_id);

-- Plugins
create table plugins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  version text not null,
  permissions text[] not null default '{}',
  tools text[] not null default '{}',
  enabled_by_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Plugins are public — everyone can see available plugins
alter table plugins enable row level security;

create policy "Anyone can read plugins"
  on plugins for select using (true);

-- User-plugin associations
create table user_plugins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plugin_id uuid not null references plugins(id) on delete cascade,
  enabled boolean not null default true,
  config jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, plugin_id)
);

alter table user_plugins enable row level security;

create policy "Users can read own plugins"
  on user_plugins for select using (auth.uid() = user_id);

create policy "Users can manage own plugins"
  on user_plugins for insert with check (auth.uid() = user_id);

create policy "Users can update own plugins"
  on user_plugins for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own plugins"
  on user_plugins for delete using (auth.uid() = user_id);

-- Seed default plugins
insert into plugins (name, description, version, permissions, tools, enabled_by_default)
values
  ('calculator', 'Perform mathematical calculations', '1.0.0', '{}', '{calculate}', true),
  ('web_search', 'Search the web for information', '1.0.0', '{web.search}', '{search}', true),
  ('files', 'Upload, read, and search files', '1.0.0', '{files.read,files.write}', '{upload,read,search,extract}', false),
  ('http', 'Make controlled HTTP requests to external APIs', '1.0.0', '{http.request}', '{request}', false);

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function public.update_updated_at();

create trigger conversations_updated_at before update on conversations
  for each row execute function public.update_updated_at();

create trigger subscriptions_updated_at before update on subscriptions
  for each row execute function public.update_updated_at();
