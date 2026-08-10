import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, KeyRound, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOrganizations } from "@/lib/data";
import { SERVICE_LABELS, getDictionary, isLang } from "@/lib/i18n";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@sismopereira.org";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/organizaciones">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getDictionary(lang).partners.heading };
}

export default async function PartnersPage({
  params,
}: PageProps<"/[lang]/organizaciones">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const { data: orgs } = await getOrganizations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.partners.heading}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{t.partners.subheading}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="gap-2 p-6">
          <h2 className="font-semibold">{t.partners.whoHeading}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.partners.whoBody}
          </p>
        </Card>
        <Card className="gap-2 p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4 text-muted-foreground" aria-hidden />
            {t.partners.apiHeading}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.partners.apiBody}
          </p>
          <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">
            POST /api/v1/status
          </code>
        </Card>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {t.partners.howHeading}
        </h2>
        <ol className="space-y-3">
          {t.partners.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border bg-muted/40 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Mail className="size-4 text-muted-foreground" aria-hidden />
          {t.partners.contactHeading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t.partners.contactBody}
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-3 inline-block font-mono text-sm font-medium underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {t.partners.orgsHeading}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {orgs.map((org) => (
            <Card key={org.id} className="gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{org.name}</p>
                  {org.short_name && org.short_name !== org.name ? (
                    <p className="text-xs text-muted-foreground">
                      {org.short_name}
                    </p>
                  ) : null}
                </div>
                {org.verified ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 gap-1 border-ok/40 bg-ok-muted text-ok-foreground"
                  >
                    <BadgeCheck className="size-3" aria-hidden />
                    {t.partners.verified}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 gap-1">
                    <Clock className="size-3" aria-hidden />
                    {t.partners.pendingVerification}
                  </Badge>
                )}
              </div>
              {org.services.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {org.services.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {SERVICE_LABELS[lang][service]}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
