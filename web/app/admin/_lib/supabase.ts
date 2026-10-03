// Server-only Supabase client for the admin area. Uses the service role key, so never import it from a client component.
import { createClient } from "@supabase/supabase-js";

export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
