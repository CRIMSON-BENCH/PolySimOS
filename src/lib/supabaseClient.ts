"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Create a single browser Supabase client. Returns null when the public env
// vars aren't set, so the whole app builds and runs without them (auth UI shows
// a friendly "not configured" state instead of crashing).
let _client: SupabaseClient | null = null;
let _tried = false;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (_tried) return _client;
  _tried = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
