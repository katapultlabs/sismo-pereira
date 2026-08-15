import type { Organization, ServiceType } from "./types";

/**
 * The household collection instruments — the `/luz` rig, per service.
 *
 * `service_reports` was keyed on `service` from the start so that water and
 * gas could inherit the rig without a second table. This file is the other
 * half of that design: the list of services whose instrument actually exists
 * as a page, and whether each one is **open for collection**.
 *
 * Two gates, both required, and they answer different questions:
 *
 * 1. `live` — a human switch. An instrument collects phone numbers in order
 *    to hand them to the operator of the service (EDITORIAL Rule 4), and a
 *    form nobody reads is worse than no form (Rule 5). This flag flips to
 *    `true` only when someone at the operating organization has confirmed
 *    they will read `/panel?servicio=…`. It is a code constant on purpose:
 *    opening a dead drop should be a reviewed diff, not a database edit.
 * 2. A **verified organization covering the service exists** — checked live
 *    via `findRecipient`. This mirrors the RLS boundary
 *    (`can_see_service_reports`): the same condition that lets an org read
 *    the rows is the condition under which collecting them makes sense.
 *
 * `instrumentOpen` is the AND of both. The page renders the honest closed
 * state otherwise, and `submitServiceReport` enforces the same gate
 * server-side so a hand-crafted POST cannot file into a closed instrument.
 */
export const INSTRUMENT_SERVICES = ["electricity", "water"] as const;
export type InstrumentService = (typeof INSTRUMENT_SERVICES)[number];

export const INSTRUMENTS: Record<
  InstrumentService,
  { path: "/luz" | "/agua"; live: boolean }
> = {
  electricity: { path: "/luz", live: true },
  /*
   * Built and gated. Flip to `true` once Aguas y Aguas (or whichever verified
   * org covers `water`) confirms a team will read the panel — and only then.
   */
  water: { path: "/agua", live: false },
};

/** The verified organization that would receive this service's reports. */
export function findRecipient(
  orgs: Organization[],
  service: ServiceType,
): Organization | null {
  return (
    orgs.find((o) => o.verified && o.services.includes(service)) ?? null
  );
}

/** Whether the instrument may collect: launch switch AND a live recipient. */
export function instrumentOpen(
  service: InstrumentService,
  orgs: Organization[],
): boolean {
  return INSTRUMENTS[service].live && findRecipient(orgs, service) !== null;
}
