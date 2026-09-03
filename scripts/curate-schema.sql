-- Minimal schema to unblock wiring/testing of app/api/curate/route.ts.
-- This covers exactly the columns the route code touches — it is NOT a
-- full inventory schema. Extend `experiences` with whatever real display
-- fields you need (title, description, images, availability, etc.)
-- before using this for anything beyond smoke-testing the agent loop.

create extension if not exists "pgcrypto";

create table if not exists travelers (
  id         uuid primary key default gen_random_uuid(),
  profile    jsonb not null default '{}'::jsonb,
  persona    text,
  created_at timestamptz not null default now()
);

create table if not exists experiences (
  id                 uuid primary key default gen_random_uuid(),
  destination        text not null,
  duration_days      integer,
  price_usd_pp_min   numeric,
  experience_dna     jsonb not null default '{}'::jsonb,  -- e.g. {"adventure":0.8,"culture":0.4,...}
  persona_fit        jsonb not null default '{}'::jsonb,  -- e.g. {"solo":0.9,"couples":0.6,...}
  created_at         timestamptz not null default now()
);

-- Seed a couple of rows so search_experiences has something to return.
insert into experiences (destination, duration_days, price_usd_pp_min, experience_dna, persona_fit) values
  ('Lamu',        4, 850,  '{"culture":0.9,"relaxation":0.8,"romance":0.7,"history":0.6}', '{"couples":0.9,"solo":0.7,"family":0.5,"social":0.6}'),
  ('Maasai Mara', 5, 1200, '{"adventure":0.9,"nature":0.95,"photography":0.8}',            '{"couples":0.8,"solo":0.7,"family":0.7,"social":0.6}'),
  ('Watamu',      4, 700,  '{"relaxation":0.9,"nature":0.7,"wellness":0.6}',               '{"family":0.9,"couples":0.7,"solo":0.5,"social":0.5}')
on conflict do nothing;

-- Row-level security stays OFF for these tables since the app only ever
-- talks to them via supabaseAdmin (the service_role key), which bypasses
-- RLS anyway. If you later add a client-side Supabase call, turn RLS on
-- and write policies before doing so.
