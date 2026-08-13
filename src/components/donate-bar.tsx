"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, HeartHandshake } from "lucide-react";

import { DONATE_PATH } from "@/components/donate-banner";
import { getDictionary, type Lang } from "@/lib/i18n";

/**
 * The slim, site-wide strip, directly under the masthead on every page.
 *
 * The `--donate` mulberry rather than inverted ink. The strip was
 * `bg-foreground` — a near-black band directly under the masthead on every
 * page — which set a funereal tone for the whole site before a reader got to
 * any content. `--donate` sits at roughly half a status colour's chroma and at
 * the furthest hue from all four, so the strip warms up without becoming a
 * fifth signal competing with the status board.
 *
 * The whole strip is the link, with an arrow rather than a button chip — the
 * masthead directly above carries a real "Donar" button, and two solid buttons
 * stacked within 40px of each other read as a mistake.
 *
 * A client component solely so it can read the pathname: on `/donar` itself
 * the strip would be a banner linking to the page you are already reading, so
 * it renders nothing there. This is the one thing on the site that appears on
 * every route, which makes "every route except one" a client-side question —
 * the root layout is a server component and cannot see the path.
 */
export function DonateBar({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const pathname = usePathname();

  if (pathname === DONATE_PATH) return null;

  return (
    <aside
      aria-label={t.donate.eyebrow}
      className="border-b border-donate/30 bg-donate text-donate-contrast"
    >
      <Link
        href={DONATE_PATH}
        className="group mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-donate-contrast sm:gap-4"
      >
        <HeartHandshake className="hidden size-4 shrink-0 sm:block" aria-hidden />

        {/* `min-w-0` so the title truncates before the affordance on the right
            is pushed off a 320px screen. */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-tight font-semibold">
            <span className="label-signage mr-2 hidden text-donate-contrast/75 md:inline">
              {t.donate.eyebrow}
            </span>
            {t.donate.barTitle}
          </span>
        </span>

        <span className="label-signage inline-flex shrink-0 items-center gap-1.5 underline-offset-4 group-hover:underline">
          {t.donate.cta}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </aside>
  );
}
