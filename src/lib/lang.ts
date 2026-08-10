import "server-only";

import { cookies, headers } from "next/headers";

import { DEFAULT_LANG, isLang, type Lang } from "./i18n";

/** Name of the cookie holding an explicit user choice from the toggle. */
export const LANG_COOKIE = "lang";

/**
 * The active language for this request:
 *   1. the `lang` cookie (an explicit choice from the header toggle)
 *   2. `x-lang`, which `src/proxy.ts` derives from Accept-Language
 *   3. Spanish
 *
 * The cookie is read here rather than only in the proxy on purpose. A server
 * action that calls `cookies().set()` must be able to re-render in the NEW
 * language within the same request, but `x-lang` was already fixed by the proxy
 * before the action ran — reading the header alone leaves the toggle one click
 * behind.
 *
 * There is deliberately no `/es` or `/en` URL prefix: one page, one URL, and
 * each reader gets their own language. A link shared into a WhatsApp group
 * therefore renders in each recipient's language rather than the sender's.
 */
export async function getLang(): Promise<Lang> {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  if (cookie && isLang(cookie)) return cookie;

  const header = (await headers()).get("x-lang");
  return header && isLang(header) ? header : DEFAULT_LANG;
}
