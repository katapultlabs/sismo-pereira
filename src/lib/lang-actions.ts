"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLang } from "./i18n";

const LANG_COOKIE = "lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persist an explicit language choice from the header toggle.
 *
 * Done as a server action rather than by writing `document.cookie` so the
 * cookie and the re-render happen in one round trip, and so the component
 * stays free of external mutation (which the React Compiler rejects).
 */
export async function setLanguage(lang: string): Promise<void> {
  if (!isLang(lang)) return;

  (await cookies()).set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  // The language affects <html lang> and the header/footer, so the whole
  // layout has to re-render, not just the current page.
  revalidatePath("/", "layout");
}
