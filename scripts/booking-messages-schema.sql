-- Run this once in the Supabase SQL editor to enable the "EscapePod
-- Support" chat panel on app/bookings/[reference]/page.tsx.
--
-- This is a one-way log, not a live two-way chat: a traveler's message is
-- stored here (so it's still there next time they open the booking) AND
-- emailed to the team (see app/api/bookings/[reference]/messages/route.ts)
-- with reply-to set to the traveler's own email — the actual reply
-- happens in the team's inbox, outside this app, same as every other
-- request-and-follow-up flow on this site.

create table if not exists booking_messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  traveler_id uuid not null references travelers(id) on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists booking_messages_booking_id_created_at_idx
  on booking_messages (booking_id, created_at asc);

-- Row-level security stays OFF, same as the other tables here — only ever
-- touched via supabaseAdmin (the service_role key), and the route that
-- touches it always resolves booking_id via a reference+traveler_id
-- lookup scoped to the authenticated session first.
