-- Run this once in the Supabase SQL editor to enable the opening-message
-- cache in app/api/curate/route.ts.
--
-- What it's for: the "starter" chips on the empty chat box (and any other
-- traveler's literal first message, before any profile exists) repeat a lot
-- across different travelers. Since the model's answer to an identical first
-- message with an identical (empty) profile is safe to reuse, we cache it
-- here the first time it's seen and skip the Haiku + Sonnet calls entirely
-- on every repeat. Anything past turn one always goes to Claude — profiles
-- diverge immediately, so nothing later ever reads or writes this table.

create table if not exists starter_cache (
  prompt      text primary key,             -- normalized (trimmed, lowercased, whitespace-collapsed) first message
  response    jsonb not null,               -- exact { text, payload, suggestions } shape returned by /api/curate
  hits        integer not null default 1,   -- how many times this cache entry has been served
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row-level security stays OFF, same as the other tables here — this is
-- only ever touched via supabaseAdmin (the service_role key).
