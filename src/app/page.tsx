import { redirect } from "next/navigation";

import { DEFAULT_LANG } from "@/lib/i18n";

/** The site lives under /es and /en; the bare root sends you to the default. */
export default function RootPage() {
  redirect(`/${DEFAULT_LANG}`);
}
