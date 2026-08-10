import { NextResponse, type NextRequest } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_LANG } from "@/lib/i18n";

/**
 * Magic-link landing route. Exchanges the one-time code for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${DEFAULT_LANG}/admin`;

  // Only allow same-site relative redirects — an open redirect here would let
  // an attacker land a freshly authenticated moderator on a hostile page.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : `/${DEFAULT_LANG}/admin`;

  if (!code) {
    return NextResponse.redirect(`${origin}/${DEFAULT_LANG}/admin/login`);
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/${DEFAULT_LANG}/admin/login`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(`[auth/callback] ${error.message}`);
    return NextResponse.redirect(`${origin}/${DEFAULT_LANG}/admin/login`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
