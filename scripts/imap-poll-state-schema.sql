-- Run this once in the Supabase SQL editor to enable inbox polling for
-- admin email replies (see app/api/admin/poll-inbox/route.ts).
--
-- Tracks the highest IMAP UID already processed, so each poll only looks
-- at messages newer than the last one it saw. Deliberately NOT based on
-- the IMAP \Seen flag — this inbox is a real, staff-used mailbox that
-- also receives every other notification this site sends (bookings,
-- guide requests, newsletter signups, etc.), and marking things "read"
-- behind a human's back would be disruptive. UID tracking means the
-- poller never touches mailbox flags at all.

create table if not exists imap_poll_state (
  id         text primary key default 'default',
  last_uid   bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Row-level security stays OFF, same as the other tables here — only ever
-- touched via supabaseAdmin (the service_role key).
