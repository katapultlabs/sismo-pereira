import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LANG, LANGS, type Lang } from "@/lib/i18n";

const LANG_COOKIE = "lang";

/**
 * Resolves the request language and publishes it as the `x-lang` header, which
 * the root layout and every page read. There are no per-language routes.
 *
 * Also permanently redirects the retired `/es/*` and `/en/*` URLs so links
 * shared before this change keep working.
 *
 * Note: `proxy` replaced `middleware` in Next.js 16 and always runs on Node.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- Retired locale-prefixed URLs -> canonical unprefixed URL ------------
  const prefix = pathname.match(/^\/(es|en)(\/.*)?$/);
  if (prefix) {
    const [, locale, rest] = prefix;
    const url = new URL(`${rest || "/"}${search}`, request.url);
    const response = NextResponse.redirect(url, 308);
    // Honour the language the old link asked for, so an /en link still shows
    // English after the redirect.
    response.cookies.set(LANG_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // `x-lang` carries only the SYSTEM locale. The explicit cookie choice is
  // applied in `getLang()`, which must be able to observe a cookie written by a
  // server action during this same request — something a header fixed here
  // cannot do.
  const headers = new Headers(request.headers);
  headers.set("x-lang", parseAcceptLanguage(request.headers.get("accept-language")));
  return NextResponse.next({ request: { headers } });
}

/**
 * Picks the best supported language from an Accept-Language header.
 *
 * Ties and unknown languages resolve to Spanish on purpose. Crawlers request
 * `en-US` by default, and this site's audience and indexable content are
 * Spanish — defaulting the other way would get the site indexed in the wrong
 * language for the people who need it.
 */
function parseAcceptLanguage(header: string | null): Lang {
  if (!header) return DEFAULT_LANG;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "*") return DEFAULT_LANG;
    if ((LANGS as readonly string[]).includes(base)) return base as Lang;
  }

  return DEFAULT_LANG;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
