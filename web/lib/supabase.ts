import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function publicUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function hasSupabaseConfig() {
  return Boolean(publicUrl() && anonKey());
}

export function createBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null;
  return createClient(publicUrl(), anonKey());
}

export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
