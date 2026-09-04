-- Run this once in the Supabase SQL editor before the "Recent plans"
-- history feature will work — the app only talks to Postgres via
-- supabase-js (PostgREST), which can't run DDL, so this table has to be
-- created by hand the same way the rest of the schema was.

create table if not exists chats (
  id           text primary key,
  traveler_id  uuid not null references travelers(id) on delete cascade,
  title        text not null,
  messages     jsonb not null default '[]'::jsonb,
  experiences  jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists chats_traveler_id_updated_at_idx
  on chats (traveler_id, updated_at desc);

-- Row-level security stays OFF, same as `travelers` and `experiences` —
-- the app only ever talks to this table via supabaseAdmin (the
-- service_role key), which bypasses RLS anyway, and every route that
-- touches it filters/writes by the authenticated traveler_id itself.
