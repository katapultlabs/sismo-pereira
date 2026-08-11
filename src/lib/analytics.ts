import type { CaptureResult } from "posthog-js";

/*
 * Analytics for the public bulletin. Everything here exists to answer one
 * question — are people finding the pages that help them — without ever
 * carrying a resident's data off this site.
 *
 * Two rules shape the whole file, and both are enforced in `beforeSend()`
 * rather than by remembering to be careful at each call site:
 *
 *   1. The control rooms are invisible. `/panel` and `/admin` render reporter
 *      phone numbers as `tel:` links, and PostHog's autocapture records the
 *      `href` of every anchor it sees. Nothing from those routes is sent.
 *   2. URLs carry no payload. The query string is stripped down to campaign
 *      parameters, so an auth code or any future search param cannot ride
 *      along inside `$current_url`.
 *
 * Analytics is never allowed to break a page: every entry point swallows its
 * own errors, and the whole thing is inert when the key is unset — which is
 * the normal state of local development.
 */

/** Set at build time on Vercel; absent locally, which disables everything. */
const ENABLED = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

/**
 * Routes that must never reach an analytics server.
 *
 * These are checked at send time rather than only at init, because PostHog is
 * a singleton living in one long-lived page: a client-side navigation from `/`
 * into `/panel` leaves it already loaded and capturing.
 */
const PRIVATE_PREFIXES = ["/panel", "/admin"] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * The only query parameters worth keeping. The site reads no search params of
 * its own (there is no `useSearchParams` anywhere), so an allowlist costs
 * nothing and keeps campaign attribution working if `/donar` or the `/luz`
 * drive is ever shared with a tagged link.
 */
const KEEP_QUERY = /^(utm_[a-z]+|ref)$/;

/** Strips everything but campaign parameters out of an absolute URL. */
function scrubUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (!KEEP_QUERY.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    // Not a URL, so it has no query string to strip. PostHog uses sentinels
    // here — `$referrer` is the literal "$direct" for an untagged visit — and
    // dropping those would break the referrer breakdown.
    return value;
  }
}

/** Reads a path out of whichever URL-ish property an event happens to carry. */
function pathOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("/")) return value;

  try {
    return new URL(value).pathname;
  } catch {
    return null;
  }
}

/**
 * PostHog's `before_send` hook: the last thing to run before anything leaves
 * the browser. Returning `null` drops the event entirely.
 */
export function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;

  const properties = event.properties ?? {};

  // Three chances to notice we are on a control room: the address bar now, and
  // whichever URL the event itself describes. A pageleave fires *after* the
  // location has already changed, so neither check alone is sufficient.
  const candidates = [
    typeof window === "undefined" ? null : window.location.pathname,
    pathOf(properties.$pathname),
    pathOf(properties.$current_url),
  ];
  if (candidates.some((path) => path && isPrivatePath(path))) return null;

  for (const key of ["$current_url", "$referrer", "$initial_current_url"]) {
    if (key in properties) properties[key] = scrubUrl(properties[key]);
  }

  return event;
}

/**
 * Records something the site could not otherwise know. Deliberately thin:
 * counts that the database already holds — how many reports were filed —
 * belong in a query, not here. What analytics adds is the shape of the
 * attempt, including the ones that never became a row.
 */
export function track(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!ENABLED) return;

  // Imported dynamically for the same reason `instrumentation-client.ts` does
  // it — a static import here would pull the whole SDK back into the bundles
  // for `/reportar` and `/luz`. By the time anyone submits a form the module
  // is already resolved, so this costs nothing at the call site.
  import("posthog-js")
    .then(({ default: posthog }) => posthog.capture(event, properties))
    .catch(() => {
      // A missed event is not worth a broken form.
    });
}
