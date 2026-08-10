import Link from "next/link";
import { ArrowRight, Info, Megaphone, Phone } from "lucide-react";

import { DegradedNotice } from "@/components/degraded-notice";
import { ServiceStatusCard } from "@/components/service-status-card";
import { UpdateCard } from "@/components/update-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getServiceStatus, getUpdates } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export default async function HomePage() {
  const lang = await getLang();
  const t = getDictionary(lang);

  const [statusResult, updatesResult] = await Promise.all([
    getServiceStatus(),
    getUpdates(8),
  ]);

  const degraded = statusResult.degraded || updatesResult.degraded;
  const statuses = statusResult.data;
  const updates = updatesResult.data;

  const pinned = updates.filter((u) => u.pinned);
  const rest = updates.filter((u) => !u.pinned);
  const hasUnknown = statuses.some((s) => s.status === "unknown");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-down/30 bg-down-muted px-3 py-1 text-xs font-medium text-down-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-down opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-down" />
          </span>
          {t.hero.eyebrow}
        </p>

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            {t.hero.subtitle}
          </p>
        </div>

        <p className="font-mono text-sm text-muted-foreground">
          {t.hero.quakeSummary}
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button size="lg" render={<Link href="/reportar" />} className="gap-2">
            <Megaphone className="size-4" aria-hidden />
            {t.hero.reportCta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/recursos" />}
            className="gap-2"
          >
            <Phone className="size-4" aria-hidden />
            {t.hero.emergencyCta}
          </Button>
        </div>
      </section>

      {degraded ? (
        <div className="mt-8">
          <DegradedNotice lang={lang} />
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Pinned / critical updates                                         */}
      {/* ---------------------------------------------------------------- */}
      {pinned.length > 0 ? (
        <section className="mt-10 space-y-3">
          {pinned.map((update) => (
            <UpdateCard key={update.id} update={update} lang={lang} />
          ))}
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Service status grid                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-12 space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t.status.heading}
            </h2>
            <p className="text-sm text-muted-foreground">{t.status.subheading}</p>
          </div>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            {t.status.viewAll}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </header>

        {hasUnknown ? (
          <Alert>
            <Info className="size-4" aria-hidden />
            <AlertDescription>{t.status.unknownNotice}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statuses.map((status) => (
            <ServiceStatusCard key={status.id} status={status} lang={lang} />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Update feed                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-12 space-y-4">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.updates.heading}
          </h2>
          <p className="text-sm text-muted-foreground">{t.updates.subheading}</p>
        </header>

        {rest.length === 0 && pinned.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t.updates.empty}
          </p>
        ) : (
          <div className="space-y-3">
            {rest.map((update) => (
              <UpdateCard key={update.id} update={update} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Contribution CTA                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-12 rounded-xl border bg-muted/40 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.partners.heading}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t.partners.subheading}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            render={<Link href="/organizaciones" />}
          >
            {t.partners.contactHeading}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </section>
    </div>
  );
}
