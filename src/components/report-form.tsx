"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReport, type SubmitReportState } from "@/lib/actions";
import {
  CATEGORY_LABELS,
  REPORT_CATEGORIES,
  SERVICE_LABELS,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { ServiceType, Zone } from "@/lib/types";

const SERVICES: ServiceType[] = [
  "electricity",
  "water",
  "gas",
  "internet",
  "mobile",
  "transport",
  "health",
];

const INITIAL: SubmitReportState = { ok: false };

function SubmitButton({ lang }: { lang: Lang }) {
  const t = getDictionary(lang).form;
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="label-signage h-11 w-full rounded-sm px-6 sm:w-auto"
    >
      {pending ? t.submitting : t.submit}
    </Button>
  );
}

export function ReportForm({ lang, zones }: { lang: Lang; zones: Zone[] }) {
  const t = getDictionary(lang);
  const [state, formAction] = useActionState(submitReport, INITIAL);

  if (state.ok) {
    return (
      <Alert className="rounded-sm border-ok/40 bg-ok-muted p-4 text-ok-foreground">
        <CheckCircle2 className="size-4" aria-hidden />
        <AlertTitle className="label-signage">{t.form.successTitle}</AlertTitle>
        <AlertDescription className="mt-1.5 space-y-3 text-ok-foreground/90">
          <p>{t.form.successBody}</p>
          <Button
            variant="outline"
            size="sm"
            className="label-signage rounded-sm"
            onClick={() => window.location.reload()}
          >
            {t.form.submitAnother}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {state.error === "server" ? (
        <Alert className="rounded-sm border-down/40 bg-down-muted text-down-foreground">
          <TriangleAlert className="size-4" aria-hidden />
          <AlertDescription className="text-down-foreground">
            {t.form.errorGeneric}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="label-signage text-muted-foreground" htmlFor="category">
            {t.form.category} <span className="text-down">*</span>
          </Label>
          {/*
            Native <select> on purpose: it is keyboard- and screen-reader-safe,
            works with zero JS, and renders as the OS picker on low-end phones —
            which is what most people reporting from the street are holding.
          */}
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldError("category"))}
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          >
            <option value="" disabled>
              {t.form.categoryPlaceholder}
            </option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[lang][c]}
              </option>
            ))}
          </select>
          {fieldError("category") ? (
            <p className="text-xs text-destructive">{t.form.required}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label className="label-signage text-muted-foreground" htmlFor="zone_slug">{t.form.zone}</Label>
          <select
            id="zone_slug"
            name="zone_slug"
            defaultValue=""
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t.form.zonePlaceholder}</option>
            {zones.map((zone) => (
              <option key={zone.slug} value={zone.slug}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="label-signage text-muted-foreground" htmlFor="service">{t.form.service}</Label>
          <select
            id="service"
            name="service"
            defaultValue=""
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">—</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[lang][s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="label-signage text-muted-foreground" htmlFor="address_hint">{t.form.addressHint}</Label>
          <Input
            id="address_hint"
            name="address_hint"
            placeholder={t.form.addressHintPlaceholder}
            maxLength={200}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="label-signage text-muted-foreground" htmlFor="description">
          {t.form.description} <span className="text-down">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          placeholder={t.form.descriptionPlaceholder}
          aria-invalid={Boolean(fieldError("description"))}
        />
        {fieldError("description") ? (
          <p className="text-xs text-destructive">{t.form.tooShort}</p>
        ) : null}
      </div>

      {/* Contact details are collected for verification and never published.
          The block is visually set apart so that promise is legible as a
          boundary, not just as a sentence someone might skim past. */}
      <fieldset className="space-y-4 border border-border bg-muted/30 p-4">
        <legend className="label-signage px-1.5 text-muted-foreground">
          {t.form.contactHeading}
        </legend>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.form.contactNote}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="label-signage text-muted-foreground" htmlFor="contact_name">{t.form.contactName}</Label>
            <Input id="contact_name" name="contact_name" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label className="label-signage text-muted-foreground" htmlFor="contact_phone">{t.form.contactPhone}</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              inputMode="tel"
              maxLength={40}
            />
          </div>
        </div>
      </fieldset>

      <SubmitButton lang={lang} />
    </form>
  );
}
