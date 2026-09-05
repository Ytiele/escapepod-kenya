-- Run this once in the Supabase SQL editor to enable the booking dashboard
-- (app/bookings, app/bookings/[reference], and booking creation in
-- app/api/book-experience/route.ts).
--
-- A booking is a SNAPSHOT taken at the moment of the request — package
-- name, destination, duration, and price are copied from `experiences` at
-- booking time rather than joined live, so a booking stays historically
-- accurate even if the underlying experience listing changes or is removed
-- later. payment_status and the timeline shown on the dashboard are both
-- DERIVED (see lib/bookings.ts) from amount_paid_usd/total_price_usd and
-- booking_status — there is no separate payment_status column to drift out
-- of sync with the numbers.

create table if not exists bookings (
  id                     uuid primary key default gen_random_uuid(),
  reference              text unique not null,               -- e.g. 'EK-482910'
  traveler_id            uuid not null references travelers(id) on delete cascade,
  experience_id          text references experiences(id) on delete set null, -- experiences.id is text (slug-style, e.g. 'mtkenya-top-tier') in this project's live schema, not the uuid shown in scripts/curate-schema.sql's bootstrap sample

  package_name           text not null,
  destination            text not null,
  duration_days          integer,
  num_travelers          integer not null default 1,
  start_date             date,
  end_date               date,
  accommodation          jsonb not null default '[]'::jsonb,
  included_activities    jsonb not null default '[]'::jsonb,

  total_price_usd        numeric not null default 0,
  amount_paid_usd        numeric not null default 0,
  next_payment_due_date  date,
  payment_history        jsonb not null default '[]'::jsonb, -- [{date, amount, method, note}]

  booking_status         text not null default 'created',    -- created | confirmed | itinerary_ready | trip_ready | completed | cancelled

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists bookings_traveler_id_created_at_idx
  on bookings (traveler_id, created_at desc);

-- Row-level security stays OFF, same as the other tables here — only ever
-- touched via supabaseAdmin (the service_role key), and every route that
-- touches it filters/writes by the authenticated traveler_id itself.

-- There's no admin UI yet, so staff currently confirm dates, advance
-- booking_status, and record payments by hand in the Supabase Table
-- Editor (or the SQL editor). Example — recording a payment received by
-- bank transfer:
--
--   update bookings
--   set amount_paid_usd = amount_paid_usd + 3000,
--       payment_history = payment_history || jsonb_build_array(
--         jsonb_build_object('date', now()::date, 'amount', 3000, 'method', 'bank transfer')
--       ),
--       updated_at = now()
--   where reference = 'EK-482910';
--
-- Advancing status once a trip is fully arranged:
--   update bookings set booking_status = 'confirmed', updated_at = now() where reference = 'EK-482910';
