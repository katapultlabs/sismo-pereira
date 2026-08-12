import { beforeSend } from "@/lib/analytics";

/*
 * Next.js runs this once in the browser, after the document loads and before
 * React hydrates. It is the whole of the PostHog install — there is no
 * provider in the tree, because nothing renders from analytics state and a
 * provider would only add a client boundary around the entire site.
 *
 * The SDK is imported dynamically, and that is deliberate. This file sits on
 * the critical path: a static import would put ~75 KB gzipped of analytics in
 * front of hydration, on a site built to be opened on a low-end phone with a
 * dying battery and one bar of signal. The import is fire-and-forget — Next
 * does not await it — so PostHog arrives in its own chunk shortly after the
 * page is already interactive. This is the same trade `luz-report-form.tsx`
 * makes for MapLibre, for the same reason: nobody waits on a measurement.
 *
 * With no `NEXT_PUBLIC_POSTHOG_KEY` this file does nothing at all, which is the
 * normal state of local development: `pnpm dev` should not write to the
 * production project, and a developer should not need a key to run the site.
 */
const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * This module can be evaluated more than once in a single page — it was
 * observed initialising PostHog twice per load in production — and a second
 * `init()` on an already-started SDK re-runs its startup path. Guard it, so
 * "has this page been counted?" has exactly one answer.
 */
let started = false;

if (token && !started) {
  started = true;

  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(token, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",

        /* Opts into the SDK's current defaults rather than its 2020 ones. */
        defaults: "2026-05-30",

        /* Pageviews are captured by hand, below.
         *
         * The SDK can do this itself with `capture_pageview: 'history_change'`,
         * which listens to the History API. That was tried first and produced
         * `$pageleave` events with no matching `$pageview` — the leaves arrived,
         * the views never did. Rather than depend on the SDK's view of when an
         * App Router navigation "happened", the two moments that matter are
         * named explicitly here: this file running, and Next telling us a route
         * transition started. Both are framework facts, not inferences. */
        capture_pageview: false,
        capture_pageleave: true,

        /* Nobody signs in to the public bulletin, and the two routes where
         * somebody does sign in are dropped in `beforeSend`. "never" means
         * PostHog stores no person profiles for anyone — the strongest
         * setting, and the honest one for a site whose readers are anonymous. */
        person_profiles: "never",

        /* Also off in the project settings, which is the setting that actually
         * governs. Repeated here so that reading this file tells the truth
         * about what the site does: residents type phone numbers and street
         * hints into `/luz` and `/reportar`, and none of that may be
         * recorded. */
        disable_session_recording: true,

        before_send: beforeSend,

        /* `api_host` is PostHog's ingestion domain; this is where the toolbar
         * and "view in PostHog" links should point. */
        ui_host: "https://us.posthog.com",
      });

      // The page that was open when PostHog finished loading.
      posthog.capture("$pageview");
    })
    .catch(() => {
      // Analytics is never allowed to take the page down with it.
    });
}

/**
 * Next calls this when an App Router navigation begins — before the address bar
 * has caught up, which is why the destination is passed rather than read from
 * `location`. Getting that backwards would file every client-side pageview
 * against the page the reader just left.
 */
export function onRouterTransitionStart(url: string): void {
  if (!token) return;

  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.capture("$pageview", {
        $current_url: new URL(url, window.location.origin).href,
      });
    })
    .catch(() => {});
}
