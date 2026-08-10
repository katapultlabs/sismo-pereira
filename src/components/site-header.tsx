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
    { href: "/organizaciones", label: t.nav.partners },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
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
          <span className="label-signage hidden text-muted-foreground/70 lg:inline">
            {t.nav.tagline}
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 md:flex">
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

          <Button
            size="sm"
            className="label-signage hidden rounded-sm md:inline-flex"
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
                  className="rounded-sm md:hidden"
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
