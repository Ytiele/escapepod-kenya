-- Run this once in the Supabase SQL editor, after booking-messages-schema.sql,
-- to enable two-way sync for the "EscapePod Support" chat panel: an admin's
-- email reply now gets imported back into the chat (see
-- app/api/admin/poll-inbox/route.ts) as a 'sender = admin' row, instead of
-- the chat being a one-way log of what the traveler sent.

alter table booking_messages
  add column if not exists sender text not null default 'traveler';

-- Guard the constraint add so re-running this script doesn't error if it's
-- already been applied.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_messages_sender_check'
  ) then
    alter table booking_messages
      add constraint booking_messages_sender_check check (sender in ('traveler', 'admin'));
  end if;
end $$;
