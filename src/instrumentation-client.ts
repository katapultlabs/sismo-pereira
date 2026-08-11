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

if (token) {
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(token, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",

        /* Opts into the SDK's current defaults rather than its 2020 ones.
         * Among them: `capture_pageview: 'history_change'`, which is what makes
         * the App Router's client-side navigations register as pageviews. Set
         * explicitly below anyway — it is the single most load-bearing option
         * here, and a future `defaults` bump should not be able to silently
         * change it. */
        defaults: "2026-05-30",
        capture_pageview: "history_change",
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
    })
    .catch(() => {
      // Analytics is never allowed to take the page down with it.
    });
}
