import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether Supabase is wired up. The site is designed to render fully without
 * it — see `src/lib/data.ts` — so that a deploy can go live before the
 * database is provisioned. Everything degrades to seed data instead of 500ing.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Request-scoped client that respects RLS as the signed-in user.
 */
export async function getServerSupabase() {
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled in the proxy, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client that BYPASSES RLS. Only for trusted server contexts:
 * partner API-key ingestion and moderation actions. Never import this into
 * anything that runs in the browser.
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
