import "server-only";

import { getServerSupabase } from "./supabase/server";

export interface Moderator {
  id: string;
  email: string | null;
  role: "admin" | "moderator";
}

/**
 * Resolve the signed-in user, if they are a moderator.
 *
 * Everywhere the site only touches the database, RLS is the authority and no
 * TypeScript check is needed — `moderation.ts` leans on that deliberately. But
 * sending a WhatsApp message is a side effect *outside* Postgres: RLS cannot
 * stop a Graph API call. So anything that talks to Meta on a person's behalf
 * asks this first.
 *
 * The role still comes from the database, read through the RLS-scoped client,
 * so `profiles` remains the single source of truth about who may moderate.
 */
export async function getModerator(): Promise<Moderator | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  if (data.role !== "admin" && data.role !== "moderator") return null;

  return { id: data.id, email: user.email ?? null, role: data.role };
}
