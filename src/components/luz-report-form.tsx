"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import {
  Activity,
  CheckCircle2,
  Crosshair,
  Phone,
  TriangleAlert,
  Zap,
  ZapOff,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import {
  submitServiceReport,
  type SubmitServiceReportState,
} from "@/lib/actions";
import {
  OUTAGE_SINCE_LABELS,
  OUTAGE_SINCE_OPTIONS,
  REPORTED_STATUS_OPTIONS,
  getDictionary,
  type Lang,
} from "@/lib/i18n";
import type { LocationSource, ReportedStatus, Zone } from "@/lib/types";

/*
 * MapLibre is ~250 KB and needs WebGL. It loads only when someone taps
 * "ajustar en el mapa" — the common path (device GPS, or just a comuna) never
 * pays for it, which matters on a low-end phone on a dying battery.
 */
const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
});

const INITIAL: SubmitServiceReportState = { ok: false };

interface Fix {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: LocationSource;
}

/** Below this, two fixes are the same place and not worth downgrading `gps`. */
const SAME_PLACE = 1e-6;

/**
 * Status is encoded three ways — colour, icon, and word — so it survives
 * greyscale, colour blindness, and a cracked screen. Class strings are literal
 * because Tailwind cannot see through interpolation.
 */
const STATUS_STYLES: Record<
  (typeof REPORTED_STATUS_OPTIONS)[number],
  { checked: string; icon: typeof Zap }
> = {
  outage: {
    checked:
      "peer-checked:border-down peer-checked:bg-down-muted peer-checked:text-down-foreground",
    icon: ZapOff,
  },
  degraded: {
    checked:
      "peer-checked:border-warn peer-checked:bg-warn-muted peer-checked:text-warn-foreground",
    icon: Activity,
  },
  operational: {
    checked:
      "peer-checked:border-ok peer-checked:bg-ok-muted peer-checked:text-ok-foreground",
    icon: Zap,
  },
};

function SubmitButton({ lang }: { lang: Lang }) {
  const t = getDictionary(lang).luz;
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="label-signage h-12 w-full rounded-sm px-6 text-base"
    >
      {pending ? t.submitting : t.submit}
    </Button>
  );
}

export function LuzReportForm({ lang, zones }: { lang: Lang; zones: Zone[] }) {
  const t = getDictionary(lang).luz;
  const [state, formAction] = useActionState(submitServiceReport, INITIAL);

  /* The utility reads the rows themselves. The gap this fills is the household
   * that opened `/luz`, filled it in, and bounced off a validation error. */
  useEffect(() => {
    if (state.ok) track("report_submitted", { form: "household" });
    else if (state.error) {
      track("report_failed", { form: "household", reason: state.error });
    }
  }, [state]);

  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<"denied" | "unavailable" | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [hazard, setHazard] = useState(false);
  const [status, setStatus] = useState<ReportedStatus | null>(null);

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
          source: "gps",
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

  /*
   * A pan that lands where the GPS already put us is not a hand-placed pin, so
   * it must not downgrade `location_source` from `gps` to `map`. The console
   * shows that field to dispatchers deciding whether to trust a coordinate.
   */
  function handleMapMove(lat: number, lng: number) {
    setFix((current) => {
      if (
        current &&
        Math.abs(current.lat - lat) < SAME_PLACE &&
        Math.abs(current.lng - lng) < SAME_PLACE
      ) {
        return current;
      }
      return { lat, lng, accuracy: null, source: "map" };
    });
  }

  if (state.ok) {
    return (
      <Alert className="rounded-sm border-ok/40 bg-ok-muted p-4 text-ok-foreground">
        <CheckCircle2 className="size-4" aria-hidden />
        <AlertTitle className="label-signage">{t.successTitle}</AlertTitle>
        <AlertDescription className="mt-1.5 space-y-3 text-ok-foreground/90">
          <p>{t.successBody}</p>
          <Button
            variant="outline"
            size="sm"
            className="label-signage rounded-sm"
            onClick={() => window.location.reload()}
          >
            {t.submitAnother}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-8">
      {state.error === "server" ? (
        <Alert className="rounded-sm border-down/40 bg-down-muted text-down-foreground">
          <TriangleAlert className="size-4" aria-hidden />
          <AlertDescription className="text-down-foreground">
            {t.errorGeneric}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* 1 — What is happening. The question people came to answer. */}
      <fieldset className="space-y-3">
        <legend className="label-signage mb-3 text-muted-foreground">
          {t.statusQuestion} <span className="text-down">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {REPORTED_STATUS_OPTIONS.map((option) => {
            const { checked, icon: Icon } = STATUS_STYLES[option];
            const label =
              option === "outage"
                ? t.statusOutage
                : option === "degraded"
                  ? t.statusDegraded
                  : t.statusOperational;

            return (
              <label
                key={option}
                className="cursor-pointer"
                htmlFor={`status-${option}`}
              >
                <input
                  type="radio"
                  id={`status-${option}`}
                  name="status"
                  value={option}
                  required
                  checked={status === option}
                  onChange={() => setStatus(option)}
                  className="peer sr-only"
                />
                <span
                  className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-sm border border-border bg-background p-4 text-center text-sm font-semibold transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 ${checked}`}
                >
                  <Icon className="size-6" aria-hidden />
                  {label}
                </span>
              </label>
            );
          })}
        </div>
        {status === "operational" ? (
          <p className="text-xs text-ok-foreground">{t.statusOperationalHint}</p>
        ) : null}
      </fieldset>

      {/* 2 — Since when. Tells the operator new fault from original fault. */}
      <div className="space-y-1.5">
        <Label className="label-signage text-muted-foreground" htmlFor="since">
          {t.sinceQuestion}
        </Label>
        <select
          id="since"
          name="since"
          defaultValue="since_quake"
          className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {OUTAGE_SINCE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {OUTAGE_SINCE_LABELS[lang][option]}
            </option>
          ))}
        </select>
      </div>

      {/* 3 — Where. */}
      <fieldset className="space-y-4 border border-border bg-muted/30 p-4">
        <legend className="label-signage px-1.5 text-muted-foreground">
          {t.locationHeading} <span className="text-down">*</span>
        </legend>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.locationWhy}
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
            {locating ? t.locating : t.useLocation}
          </Button>

          {fix ? (
            <span className="flex items-center gap-2 font-mono text-xs text-ok-foreground">
              <CheckCircle2 className="size-4" aria-hidden />
              {t.locationReady}
              {fix.accuracy != null ? (
                <span className="text-muted-foreground">
                  · {t.accuracy} ±{Math.round(fix.accuracy)} m
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        {geoError ? (
          <p className="border border-warn/40 bg-warn-muted p-3 text-xs text-warn-foreground">
            {geoError === "denied" ? t.locationDenied : t.locationUnavailable}
          </p>
        ) : null}

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMap((v) => !v)}
            className="label-signage h-9 rounded-sm px-2"
          >
            {showMap ? t.hideMap : t.adjustOnMap}
          </Button>
        </div>

        {showMap ? (
          <LocationPicker
            lat={fix?.lat ?? null}
            lng={fix?.lng ?? null}
            onChange={handleMapMove}
            lang={lang}
          />
        ) : null}

        {/* The submitted location. Written by GPS or by the map, never typed. */}
        <input type="hidden" name="lat" value={fix?.lat ?? ""} />
        <input type="hidden" name="lng" value={fix?.lng ?? ""} />
        <input
          type="hidden"
          name="location_accuracy_m"
          value={fix?.accuracy ?? ""}
        />
        <input type="hidden" name="location_source" value={fix?.source ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              className="label-signage text-muted-foreground"
              htmlFor="zone_slug"
            >
              {getDictionary(lang).form.zone}
            </Label>
            <select
              id="zone_slug"
              name="zone_slug"
              defaultValue=""
              aria-invalid={Boolean(fieldError("zone_slug"))}
              className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            >
              <option value="">{getDictionary(lang).form.zonePlaceholder}</option>
              {zones.map((zone) => (
                <option key={zone.slug} value={zone.slug}>
                  {zone.name}
                </option>
              ))}
            </select>
            {fieldError("zone_slug") ? (
              <p className="text-xs text-destructive">{t.errorLocation}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              className="label-signage text-muted-foreground"
              htmlFor="address_hint"
            >
              {getDictionary(lang).form.addressHint}
            </Label>
            <Input
              id="address_hint"
              name="address_hint"
              placeholder={getDictionary(lang).form.addressHintPlaceholder}
              maxLength={200}
              className="h-11"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm" htmlFor="on_behalf">
          <input
            type="checkbox"
            id="on_behalf"
            name="on_behalf"
            className="mt-0.5 size-4 shrink-0 accent-foreground"
          />
          <span>
            {t.onBehalf}
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t.onBehalfHint}
            </span>
          </span>
        </label>
      </fieldset>

      {/* 4 — Hazards. Life-safety, so it interrupts rather than files quietly. */}
      <fieldset className="space-y-3">
        <legend className="label-signage mb-2 text-muted-foreground">
          {t.hazardHeading}
        </legend>
        <label className="flex items-start gap-3 text-sm" htmlFor="hazard">
          <input
            type="checkbox"
            id="hazard"
            name="hazard"
            checked={hazard}
            onChange={(e) => setHazard(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-foreground"
          />
          <span>{t.hazardLabel}</span>
        </label>

        {hazard ? (
          <Alert className="rounded-sm border-down/40 bg-down-muted text-down-foreground">
            <TriangleAlert className="size-4" aria-hidden />
            <AlertDescription className="space-y-3 text-down-foreground">
              <p>{t.hazardWarning}</p>
              <Button
                variant="outline"
                size="sm"
                className="label-signage rounded-sm"
                render={<a href="tel:123" />}
              >
                <Phone className="size-4" aria-hidden />
                {t.hazardCall}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </fieldset>

      {/* 5 — Contact. Required, and what it is for is said next to the field. */}
      <fieldset className="space-y-4 border border-border bg-muted/30 p-4">
        <legend className="label-signage px-1.5 text-muted-foreground">
          {t.contactHeading}
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              className="label-signage text-muted-foreground"
              htmlFor="contact_phone"
            >
              {t.phone} <span className="text-down">*</span>
            </Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={40}
              aria-invalid={Boolean(fieldError("contact_phone"))}
              aria-describedby="contact_phone-hint"
              className="h-11 font-mono"
            />
            <p id="contact_phone-hint" className="text-xs text-muted-foreground">
              {t.phoneHint}
            </p>
            {fieldError("contact_phone") ? (
              <p className="text-xs text-destructive">{t.phoneError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              className="label-signage text-muted-foreground"
              htmlFor="matricula"
            >
              {t.matricula}
            </Label>
            <Input
              id="matricula"
              name="matricula"
              inputMode="numeric"
              maxLength={40}
              aria-describedby="matricula-hint"
              className="h-11 font-mono"
            />
            <p id="matricula-hint" className="text-xs text-muted-foreground">
              {t.matriculaHint}
            </p>
          </div>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label className="label-signage text-muted-foreground" htmlFor="note">
          {t.note}
        </Label>
        <Textarea
          id="note"
          name="note"
          maxLength={600}
          rows={3}
          placeholder={t.notePlaceholder}
        />
      </div>

      {/*
        Said immediately above the button that does it, not in a policy page.
        There is no tick box: see docs/DECISIONS.md — we state what happens to
        the number rather than asking permission for it.
      */}
      <p className="border-l-2 border-foreground/25 pl-3 text-xs leading-relaxed text-muted-foreground">
        {t.handoverNotice}
      </p>

      <SubmitButton lang={lang} />
    </form>
  );
}
