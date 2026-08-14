import type { Metadata } from "next";
import { BadgeCheck, Clock, KeyRound, Mail } from "lucide-react";

import { getOrganizations } from "@/lib/data";
import { SERVICE_LABELS, getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

/**
 * Deliberately has no default. Printing a plausible-looking address that
 * nobody reads would be exactly the kind of unverified contact information
 * this site refuses to publish elsewhere. Until it's set, we point partners
 * at the public repo, which definitely exists.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;
const REPO_ISSUES_URL = "https://github.com/katapultlabs/sismo-pereira/issues";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).partners.heading };
}

const CHIP =
  "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em]";

export default async function PartnersPage() {
  const lang = await getLang();
  const t = getDictionary(lang);
  const { data: orgs } = await getOrganizations();

  return (
    <div className="pb-12">
      <h1 className="display-condensed text-center text-3xl font-extrabold uppercase sm:text-4xl">
        {t.partners.heading}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
        {t.partners.subheading}
      </p>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5">
          <h2 className="label-signage text-muted-foreground">
            {t.partners.whoHeading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{t.partners.whoBody}</p>
        </section>
        <section className="rounded-sm border border-border bg-card p-5">
          <h2 className="label-signage flex items-center gap-1.5 text-muted-foreground">
            <KeyRound className="size-3.5" aria-hidden />
            {t.partners.apiHeading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{t.partners.apiBody}</p>
          <code className="mt-3 block overflow-x-auto border border-border bg-muted px-3 py-2 font-mono text-xs">
            POST /api/v1/status
          </code>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
          {t.partners.howHeading}
        </h2>
        <ol className="mt-4">
          {t.partners.steps.map((step, i) => (
            <li
              key={step}
              className="flex gap-4 border-b border-border py-3 last:border-b-0"
            >
              <span
                data-readout
                aria-hidden
                className="label-signage shrink-0 pt-0.5 text-muted-foreground"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 rounded-sm border border-border bg-muted/40 p-5">
        <h2 className="label-signage flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5" aria-hidden />
          {t.partners.contactHeading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{t.partners.contactBody}</p>
        {CONTACT_EMAIL ? (
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 inline-block font-mono text-sm font-semibold underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
        ) : (
          <a
            href={REPO_ISSUES_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block font-mono text-sm font-semibold underline underline-offset-4"
          >
            github.com/katapultlabs/sismo-pereira
          </a>
        )}
      </section>

      <section className="mt-12">
        <h2 className="label-signage border-b border-foreground/25 pb-2 text-muted-foreground">
          {t.partners.orgsHeading}
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {orgs.map((org) => (
            <article
              key={org.id}
              className="group flex flex-col gap-2 rounded-sm border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="display-condensed truncate text-base font-bold">
                    {org.name}
                  </p>
                  {org.short_name && org.short_name !== org.name ? (
                    <p className="font-mono text-[0.6875rem] text-muted-foreground">
                      {org.short_name}
                    </p>
                  ) : null}
                </div>
                {org.verified ? (
                  <span
                    className={`${CHIP} shrink-0 border-ok/40 bg-ok-muted text-ok-foreground`}
                  >
                    <BadgeCheck className="size-3" aria-hidden />
                    {t.partners.verified}
                  </span>
                ) : (
                  <span
                    className={`${CHIP} shrink-0 border-border text-muted-foreground`}
                  >
                    <Clock className="size-3" aria-hidden />
                    {t.partners.pendingVerification}
                  </span>
                )}
              </div>
              {org.services.length > 0 ? (
                <div className="mt-auto flex flex-wrap gap-1">
                  {org.services.map((service) => (
                    <span
                      key={service}
                      className={`${CHIP} border-transparent bg-secondary text-secondary-foreground`}
                    >
                      {SERVICE_LABELS[lang][service]}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
