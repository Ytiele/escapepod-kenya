import { createClient } from '@supabase/supabase-js';

// Server-side only — this uses the service_role key, which bypasses row-level
// security. Never import this file from a client component, and never expose
// SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
