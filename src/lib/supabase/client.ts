"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser client, used for realtime subscriptions on the status dashboard.
 * Returns null when Supabase isn't configured so callers can skip subscribing.
 */
export function getBrowserSupabase() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
