"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDictionary, localePath, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const pathname = usePathname();
  const otherLang: Lang = lang === "es" ? "en" : "es";

  const items = [
    { href: localePath(lang, "/"), label: t.nav.home },
    { href: localePath(lang, "/servicios"), label: t.nav.services },
    { href: localePath(lang, "/reportes"), label: t.nav.reports },
    { href: localePath(lang, "/recursos"), label: t.nav.resources },
    { href: localePath(lang, "/organizaciones"), label: t.nav.partners },
  ];

  // Swap only the leading locale segment so the toggle keeps you on the page
  // you were already reading.
  const swappedPath = pathname.replace(/^\/(es|en)/, `/${otherLang}`);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link
          href={localePath(lang, "/")}
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <Activity className="size-5 text-down" aria-hidden />
          <span>Sismo Pereira</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={swappedPath}
            hrefLang={otherLang}
            className="rounded-md px-2 py-1 font-mono text-xs text-muted-foreground uppercase transition-colors hover:bg-secondary hover:text-foreground"
          >
            {otherLang}
          </Link>

          {/* The emergency line stays one tap away on every page, at every width. */}
          <Button
            size="sm"
            className="gap-1.5 bg-down font-semibold text-down-foreground hover:bg-down/90"
            render={<a href="tel:123" aria-label={`${t.hero.emergencyCta}: 123`} />}
          >
            <Phone className="size-3.5" aria-hidden />
            <span className="font-mono">123</span>
          </Button>

          <Button
            size="sm"
            className="hidden md:inline-flex"
            render={<Link href={localePath(lang, "/reportar")} />}
          >
            {t.nav.submit}
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="size-4" aria-hidden />
                  <span className="sr-only">{t.nav.home}</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Sismo Pereira</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm",
                      pathname === item.href
                        ? "bg-secondary font-medium"
                        : "text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  className="mt-3"
                  render={<Link href={localePath(lang, "/reportar")} />}
                >
                  {t.nav.submit}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
