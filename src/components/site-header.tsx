"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone } from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { Seismograph } from "@/components/seismograph";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const pathname = usePathname();

  const items = [
    { href: "/", label: t.nav.home },
    { href: "/servicios", label: t.nav.services },
    { href: "/reportes", label: t.nav.reports },
    { href: "/recursos", label: t.nav.resources },
    { href: "/enlaces", label: t.nav.links },
    { href: "/organizaciones", label: t.nav.partners },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        /* The landing carries its own vertical rail from `lg` — wordmark,
           123, section plates, donate, language — so the horizontal masthead
           yields to it there and returns on every other route. */
        pathname === "/" && "lg:hidden",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        {/*
         * `min-w-0` rather than `shrink-0`: on a 320px phone the wordmark must
         * give way and truncate, because the one control that may never be
         * pushed off-screen is the 123 button.
         */}
        <Link
          href="/"
          className="flex min-w-0 items-baseline gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Epicentre mark. The only non-status use of the alert hue, and it
              is a shape rather than a signal, so it cannot be misread. */}
          <span className="size-2 shrink-0 translate-y-px bg-down" aria-hidden />
          <span className="display-condensed truncate text-lg leading-none uppercase">
            <span className="font-extrabold">Sismo</span>
            <span className="ml-1.5 font-normal text-muted-foreground">
              Pereira
            </span>
          </span>
          {/*
           * The "Boletín de situación" tagline used to sit here at `xl`. It
           * was dropped when the donate button joined the right-hand cluster:
           * this row is capped at `max-w-6xl` (1152px), so the space does not
           * grow with the viewport, and the tagline was truncating the
           * wordmark to "SISMO PER…" at every width where it appeared. It is
           * decoration and it still runs under the footer wordmark; the
           * masthead's job is the six routes, 123, and the two actions.
           */}
        </Link>

        {/*
         * The inline nav starts at `lg`, not `md`. Six items plus the right-hand
         * cluster need ~980px; at 768 they left the wordmark 9px to truncate
         * into, which is to say they erased it. Tablets get the sheet instead,
         * which holds the same six comfortably in a column.
         */}
        <nav className="ml-6 hidden items-center gap-5 lg:flex">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "label-signage border-b-2 py-1 transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <LanguageToggle current={lang} />
          <ThemeToggle lang={lang} className="hidden sm:inline-flex" />

          {/* The emergency line stays one tap away on every page, at every
              width. Set as a signage plate: solid fill, square, mono numerals. */}
          <Button
            size="sm"
            className="gap-1.5 rounded-sm bg-down font-mono font-semibold tracking-wider text-down-contrast hover:bg-down/90"
            render={<a href="tel:123" aria-label={`${t.hero.emergencyCta}: 123`} />}
          >
            <Phone className="size-3.5" aria-hidden />
            123
          </Button>

          {/*
           * Donate outranks Report in the masthead and appears from `sm`,
           * where Report only appears from `xl`. The cluster does not hold
           * both plus 123 below 1280 — measured, not guessed — and between
           * the two, Report stays reachable from the hero, the reports page,
           * the footer, and the sheet, while this is the appeal we were asked
           * to put in front of everyone. 123 is still never displaced.
           *
           * Solid fill for Donate, outline for Report: three solid buttons in
           * one cluster flattens the hierarchy that the red 123 depends on.
           */}
          <Button
            size="sm"
            className="label-signage hidden rounded-sm sm:inline-flex"
            render={<Link href="/donar" />}
          >
            {t.donate.cta}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="label-signage hidden rounded-sm xl:inline-flex"
            render={<Link href="/reportar" />}
          >
            {t.nav.submit}
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-sm lg:hidden"
                >
                  <Menu className="size-4" aria-hidden />
                  <span className="sr-only">{t.nav.menu}</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="display-condensed text-base uppercase">
                  Sismo Pereira
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-4">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "label-signage border-b border-border py-3 transition-colors",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  className="label-signage mt-4 rounded-sm"
                  render={<Link href="/donar" />}
                >
                  {t.donate.cta}
                </Button>
                <Button
                  variant="outline"
                  className="label-signage mt-2 rounded-sm"
                  render={<Link href="/reportar" />}
                >
                  {t.nav.submit}
                </Button>
                {/* Mobile is where night reading actually happens, so the
                    switch has to be reachable without a desktop viewport. */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="label-signage text-muted-foreground">
                    {t.theme.label}
                  </span>
                  <ThemeToggle lang={lang} />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* The masthead's bottom edge is a seismograph trace rather than a rule. */}
      <Seismograph className="-mb-px" />
    </header>
  );
}
