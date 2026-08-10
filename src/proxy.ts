import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LANG, LANGS } from "@/lib/i18n";

/**
 * Two jobs:
 *  1. Send bare `/` to the visitor's preferred language.
 *  2. Publish the active locale as `x-lang` so the ROOT layout can set
 *     `<html lang>` correctly. A nested layout cannot set attributes on the
 *     root <html> element, and getting this wrong makes screen readers
 *     pronounce Spanish content with an English voice.
 *
 * Note: `proxy` replaced `middleware` in Next.js 16 and always runs on Node.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segment = pathname.split("/")[1];
  const matched = (LANGS as readonly string[]).includes(segment)
    ? (segment as (typeof LANGS)[number])
    : null;

  if (!matched && (pathname === "/" || pathname === "")) {
    const preferred = pickLanguage(request.headers.get("accept-language"));
    return NextResponse.redirect(new URL(`/${preferred}`, request.url));
  }

  const headers = new Headers(request.headers);
  headers.set("x-lang", matched ?? DEFAULT_LANG);
  return NextResponse.next({ request: { headers } });
}

function pickLanguage(header: string | null): (typeof LANGS)[number] {
  if (!header) return DEFAULT_LANG;
  // Spanish stays the default for anything ambiguous — this site is for Pereira.
  const prefersEnglish = header
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .some((part, index) => part.startsWith("en") && index === 0);
  return prefersEnglish ? "en" : DEFAULT_LANG;
}

export const config = {
  matcher: [
    // Everything except static assets, API routes, and metadata files.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
