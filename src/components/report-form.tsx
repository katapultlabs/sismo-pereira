"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import { CheckCircle2, Crosshair, TriangleAlert } from "lucide-react";

import { track } from "@/lib/analytics";
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

/* Same lazy-load rule as the service instruments: MapLibre is ~250 KB and
 * only loads when someone taps "ajustar en el mapa". */
const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
});

interface Fix {
  lat: number;
  lng: number;
  accuracy: number | null;
}

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

  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<"denied" | "unavailable" | null>(
    null,
  );
  const [showMap, setShowMap] = useState(false);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("unavailable");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  /* The database counts the reports that were filed. What it cannot show is
   * the person who tried and was turned away, so that is what we record. */
  useEffect(() => {
    if (state.ok) track("report_submitted", { form: "community" });
    else if (state.error) {
      track("report_failed", { form: "community", reason: state.error });
    }
  }, [state]);

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

      {/* Precise location — optional here, unlike the service instruments,
          because a community report a moderator can follow up on is useful
          without coordinates. The pattern (GPS first, map to adjust) is the
          same one /luz established. */}
      <fieldset className="space-y-4 border border-border bg-muted/30 p-4">
        <legend className="label-signage px-1.5 text-muted-foreground">
          {t.location.heading}
        </legend>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.location.why}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={requestLocation}
            disabled={locating}
            className="label-signage h-11 rounded-sm"
          >
            <Crosshair className="size-4" aria-hidden />
            {locating ? t.location.locating : t.location.useLocation}
          </Button>

          {fix ? (
            <span className="flex items-center gap-2 font-mono text-xs text-ok-foreground">
              <CheckCircle2 className="size-4" aria-hidden />
              {t.location.ready}
              {fix.accuracy != null ? (
                <span className="text-muted-foreground">
                  · {t.location.accuracy} ±{Math.round(fix.accuracy)} m
                </span>
              ) : null}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            className="label-signage h-9 rounded-sm px-2"
          >
            {showMap ? t.location.hideMap : t.location.adjustOnMap}
          </Button>
        </div>

        {geoError ? (
          <p className="border border-warn/40 bg-warn-muted p-3 text-xs text-warn-foreground">
            {geoError === "denied" ? t.location.denied : t.location.unavailable}
          </p>
        ) : null}

        {showMap ? (
          <LocationPicker
            lat={fix?.lat ?? null}
            lng={fix?.lng ?? null}
            onChange={(lat, lng) => setFix({ lat, lng, accuracy: null })}
            lang={lang}
          />
        ) : null}

        {/* Written by GPS or the map, never typed. */}
        <input type="hidden" name="lat" value={fix?.lat ?? ""} />
        <input type="hidden" name="lng" value={fix?.lng ?? ""} />
      </fieldset>

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
