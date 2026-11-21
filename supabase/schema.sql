-- Wasil Oman database schema
-- Run this once in Supabase → SQL Editor → New query → Run

create extension if not exists pgcrypto;

-- Connected WhatsApp Business number (one per user)
create table if not exists whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users on delete cascade,
  waba_id text not null,
  phone_number_id text not null unique,
  display_phone text,
  verified_name text,
  access_token text not null,
  connected_via text not null default 'facebook',
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text,
  phone text not null,
  tags text[] not null default '{}',
  attributes jsonb not null default '{}',
  opted_in boolean not null default true,
  last_inbound_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  unread int not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, phone)
);
create index if not exists contacts_owner_last on contacts (owner_id, last_message_at desc nulls last);

create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  template_name text not null,
  template_language text not null,
  template_components jsonb not null default '[]',
  variable_map jsonb not null default '[]',
  header_media_id text,
  header_type text,
  audience_tags text[] not null default '{}',
  status text not null default 'draft', -- draft | scheduled | sending | completed | failed
  scheduled_at timestamptz,
  total int not null default 0,
  sent int not null default 0,
  delivered int not null default 0,
  read int not null default 0,
  failed int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references broadcasts on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  contact_id uuid references contacts on delete set null,
  phone text not null,
  name text,
  attributes jsonb not null default '{}',
  status text not null default 'pending', -- pending | sent | delivered | read | failed
  wa_message_id text,
  error text,
  updated_at timestamptz not null default now()
);
create index if not exists br_broadcast_status on broadcast_recipients (broadcast_id, status);
create index if not exists br_wamid on broadcast_recipients (wa_message_id);
create index if not exists br_contact on broadcast_recipients (contact_id);
create index if not exists br_owner on broadcast_recipients (owner_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  contact_id uuid not null references contacts on delete cascade,
  direction text not null, -- in | out
  type text not null default 'text',
  body text,
  payload jsonb,
  wa_message_id text,
  status text,
  source text, -- inbox | bot | broadcast | customer
  created_at timestamptz not null default now()
);
create index if not exists messages_contact on messages (owner_id, contact_id, created_at);
create index if not exists messages_contact_only on messages (contact_id);
create index if not exists messages_wamid on messages (wa_message_id);

create table if not exists flows (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  match_type text not null default 'exact', -- exact | contains | any
  is_active boolean not null default false,
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  runs int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flow_sessions (
  owner_id uuid not null references auth.users on delete cascade,
  contact_id uuid not null references contacts on delete cascade,
  flow_id uuid not null references flows on delete cascade,
  node_id text not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, contact_id)
);
create index if not exists flow_sessions_contact on flow_sessions (contact_id);
create index if not exists flow_sessions_flow on flow_sessions (flow_id);
create index if not exists flows_owner on flows (owner_id);
create index if not exists broadcasts_owner on broadcasts (owner_id, created_at desc);

-- Row level security: every user only sees their own data
do $$
declare t text;
begin
  foreach t in array array['whatsapp_accounts','contacts','broadcasts','broadcast_recipients','messages','flows','flow_sessions']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format('create policy owner_all on %I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

create or replace function refresh_broadcast_stats(b uuid) returns void language sql security definer set search_path = public as $$
  update broadcasts set
    total = (select count(*) from broadcast_recipients where broadcast_id = b),
    sent = (select count(*) from broadcast_recipients where broadcast_id = b and status in ('sent','delivered','read')),
    delivered = (select count(*) from broadcast_recipients where broadcast_id = b and status in ('delivered','read')),
    read = (select count(*) from broadcast_recipients where broadcast_id = b and status = 'read'),
    failed = (select count(*) from broadcast_recipients where broadcast_id = b and status = 'failed')
  where id = b;
$$;
-- Only the server (service role) may call this
revoke execute on function refresh_broadcast_stats(uuid) from public, anon, authenticated;

-- Live inbox updates
do $$ begin
  alter publication supabase_realtime add table messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table contacts;
exception when others then null; end $$;
