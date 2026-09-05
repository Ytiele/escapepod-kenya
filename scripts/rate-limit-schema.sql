-- Run this once in the Supabase SQL editor to enable rate limiting
-- (lib/security.ts -> checkRateLimit), applied across auth, the Curation
-- Engine, and the public contact-form endpoints to blunt brute-force
-- login attempts, mass account creation, Anthropic cost-abuse, and
-- email-flood/spam submissions.

create table if not exists rate_limits (
  key          text primary key,              -- e.g. 'login:ip:1.2.3.4' or 'curate:user:<uuid>'
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

-- Atomically increments the counter for `p_key`, resetting it if the
-- current window has expired. Single statement so concurrent requests
-- for the same key can't race each other into under-counting.
create or replace function rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns table(allowed boolean, remaining integer) as $$
declare
  v_count integer;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else rate_limits.window_start
        end
  returning count into v_count;

  return query select (v_count <= p_max), greatest(p_max - v_count, 0);
end;
$$ language plpgsql;

-- Row-level security stays OFF, same as the other tables here — only ever
-- touched via supabaseAdmin (the service_role key).

-- Optional housekeeping: rows older than a day are dead weight (every
-- window used in this app is under an hour). Run occasionally by hand, or
-- wire up as a Supabase cron job if you want it automatic:
-- delete from rate_limits where window_start < now() - interval '1 day';
