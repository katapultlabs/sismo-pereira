import "server-only";

import { getLinks, getResources, getServiceStatus } from "../data";
import {
  RESOURCE_LABELS,
  SERVICE_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  formatDateTime,
  type Lang,
} from "../i18n";
import type { ServiceStatus, ServiceType, StatusLevel } from "../types";

/**
 * Composes the automated replies.
 *
 * Two rules govern every string in this file, and they are the same two that
 * govern the website:
 *
 *  1. Nothing is invented. Every answer is rendered from the same `data.ts`
 *     helpers the pages use, so a WhatsApp reply and the site can never
 *     disagree. When there is no data, the reply says so — it does not
 *     fall back to "everything looks fine".
 *  2. Every claim carries its source and its time (Rule 3). A status line
 *     without «Actualizado» is a status line someone will screenshot tomorrow
 *     and read as current.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sismopereira.org";

/**
 * Appended to every automated message.
 *
 * The disclaimer is not boilerplate. People will treat any WhatsApp number
 * that answers as an emergency line, and this one is answered by moderators
 * when they are awake. Saying so on every single message is the only honest
 * way to run it.
 */
function footer(lang: Lang): string {
  return lang === "es"
    ? "—\n⚠️ Esto no es una línea de emergencia. Si hay riesgo para la vida, llama al *123*.\n" +
        SITE
    : "—\n⚠️ This is not an emergency line. If life is at risk, call *123*.\n" + SITE;
}

/**
 * The website renders `<DegradedNotice>` whenever a query fell back to seed
 * content. WhatsApp has no banner, so the warning has to travel inside the
 * message — otherwise a stale fallback status reads exactly like a live one,
 * which is the failure Rule 7 makes the site visibly announce.
 */
const DEGRADED_NOTE: Record<Lang, string> = {
  es:
    "⚠️ No pudimos consultar la base de datos en vivo. Esto es el último " +
    "contenido publicado con el sitio y puede estar desactualizado.",
  en:
    "⚠️ We could not reach the live database. This is the last content shipped " +
    "with the site and may be out of date.",
};

function withFooter(body: string, lang: Lang, degraded = false): string {
  const parts = [body];
  if (degraded) parts.push(DEGRADED_NOTE[lang]);
  parts.push(footer(lang));
  return parts.join("\n\n");
}

/**
 * A text-only status marker.
 *
 * On the website status is encoded three ways — colour, icon and text. WhatsApp
 * gives us none of the first two, so the text has to carry the whole signal,
 * and the marker is a word rather than a coloured dot for the same reason.
 */
function statusLine(row: ServiceStatus, lang: Lang): string {
  const label = STATUS_LABELS[lang][row.status];
  const scope = row.zone_name ?? (lang === "es" ? "Toda la ciudad" : "Citywide");
  const when = formatDateTime(row.reported_at, lang);
  const who = row.org_short_name ?? row.org_name ?? SOURCE_LABELS[lang][row.source];

  const parts = [`*${label}* — ${scope}`];
  if (row.headline) parts.push(row.headline);
  parts.push(`${when} · ${who}`);
  return parts.join("\n");
}

/** Who told us. Rule 3: a status line without an attribution is not a claim. */
function attribution(row: ServiceStatus, lang: Lang): string {
  return row.org_short_name ?? row.org_name ?? SOURCE_LABELS[lang][row.source];
}

const UNKNOWN_NOTE: Record<Lang, string> = {
  es:
    "«Sin confirmar» significa que el operador todavía no ha reportado. " +
    "No asumas que funciona ni que está caído.",
  en:
    "“Unconfirmed” means the operator has not reported yet. " +
    "Do not assume it is working, or that it is down.",
};

function noDataFor(service: ServiceType, lang: Lang): string {
  const name = SERVICE_LABELS[lang][service];
  return lang === "es"
    ? `No tenemos ningún reporte confirmado sobre *${name}*.\n\n${UNKNOWN_NOTE.es}`
    : `We have no confirmed report about *${name}*.\n\n${UNKNOWN_NOTE.en}`;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function helpReply(lang: Lang): string {
  const body =
    lang === "es"
      ? [
          "*Sismo Pereira* — información verificada.",
          "",
          "Responde con una palabra:",
          "*ESTADO* — todos los servicios",
          "*AGUA*, *LUZ*, *GAS*, *INTERNET*, *SEÑAL*, *TRANSPORTE*, *SALUD*, *GASOLINA*",
          "*ALBERGUES* — puntos de ayuda verificados",
          "*ENLACES* — otros sitios oficiales",
          "*ALERTAS* — recibir avisos importantes",
          "*SALIR* — dejar de recibirlos",
          "*EN* — switch to English",
          "",
          "O escríbenos lo que estás viendo y un moderador lo revisará.",
        ].join("\n")
      : [
          "*Sismo Pereira* — verified information.",
          "",
          "Reply with one word:",
          "*STATUS* — all utilities",
          "*WATER*, *POWER*, *GAS*, *INTERNET*, *SIGNAL*, *TRANSPORT*, *HEALTH*, *FUEL*",
          "*SHELTERS* — verified aid points",
          "*LINKS* — other official sites",
          "*SUBSCRIBE* — get important alerts",
          "*STOP* — stop receiving them",
          "*ES* — cambiar a español",
          "",
          "Or just tell us what you are seeing and a moderator will review it.",
        ].join("\n");

  return withFooter(body, lang);
}

export function emergencyReply(lang: Lang): string {
  const body =
    lang === "es"
      ? [
          "*Llama al 123.*",
          "",
          "Esta línea de WhatsApp la atienden moderadores voluntarios y no " +
            "está monitoreada las 24 horas. Para una emergencia con riesgo " +
            "para la vida, el 123 es el canal correcto.",
          "",
          "Bomberos Pereira: *119* · Cruz Roja: *132* · Defensa Civil: *144*",
        ].join("\n")
      : [
          "*Call 123.*",
          "",
          "This WhatsApp line is staffed by volunteer moderators and is not " +
            "monitored around the clock. For a life-threatening emergency, " +
            "123 is the right channel.",
          "",
          "Fire: *119* · Red Cross: *132* · Civil Defence: *144*",
        ].join("\n");

  return withFooter(body, lang);
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Citywide row first, then zones — the same order the site reads in. */
function sortRows(rows: ServiceStatus[]): ServiceStatus[] {
  return [...rows].sort((a, b) => {
    if (!a.zone_slug && b.zone_slug) return -1;
    if (a.zone_slug && !b.zone_slug) return 1;
    return (a.zone_name ?? "").localeCompare(b.zone_name ?? "");
  });
}

/** Worst state present, used only to order the summary — never to infer one. */
const SEVERITY_ORDER: Record<StatusLevel, number> = {
  outage: 0,
  degraded: 1,
  restoring: 2,
  unknown: 3,
  operational: 4,
};

export async function statusAllReply(
  lang: Lang,
): Promise<{ text: string; degraded: boolean }> {
  const { data: rows, degraded } = await getServiceStatus();

  if (rows.length === 0) {
    return {
      text: withFooter(
        lang === "es"
          ? `Todavía no tenemos ningún estado confirmado.\n\n${UNKNOWN_NOTE.es}`
          : `We have no confirmed status yet.\n\n${UNKNOWN_NOTE.en}`,
        lang,
        degraded,
      ),
      degraded,
    };
  }

  // One line per service: the citywide row if there is one, otherwise the
  // most severe zone row, with a pointer to the site for the zone breakdown.
  const byService = new Map<ServiceType, ServiceStatus[]>();
  for (const row of rows) {
    const list = byService.get(row.service) ?? [];
    list.push(row);
    byService.set(row.service, list);
  }

  const lines: string[] = [];
  for (const [service, list] of byService) {
    const sorted = [...list].sort(
      (a, b) => SEVERITY_ORDER[a.status] - SEVERITY_ORDER[b.status],
    );
    const lead = list.find((r) => !r.zone_slug) ?? sorted[0];
    const others = list.length - 1;

    const suffix =
      others > 0
        ? lang === "es"
          ? ` (+${others} zona${others === 1 ? "" : "s"})`
          : ` (+${others} zone${others === 1 ? "" : "s"})`
        : "";

    // Time AND source on every line. The summary is not a lighter-weight
    // claim than the detail view — it is the same claim, read faster, and it
    // is the version that gets screenshotted.
    lines.push(
      `*${SERVICE_LABELS[lang][service]}*: ${STATUS_LABELS[lang][lead.status]}${suffix}` +
        `\n  ${formatDateTime(lead.reported_at, lang)} · ${attribution(lead, lang)}`,
    );
  }

  const hasUnknown = rows.some((r) => r.status === "unknown");
  const header =
    lang === "es" ? "*Estado de servicios*" : "*Utility status*";
  const detail =
    lang === "es"
      ? `Detalle por zona: ${SITE}/servicios`
      : `Zone-by-zone detail: ${SITE}/servicios`;

  const body = [
    header,
    "",
    lines.join("\n"),
    "",
    ...(hasUnknown ? [UNKNOWN_NOTE[lang], ""] : []),
    detail,
  ].join("\n");

  return { text: withFooter(body, lang, degraded), degraded };
}

export async function statusServiceReply(
  service: ServiceType,
  lang: Lang,
): Promise<{ text: string; degraded: boolean }> {
  const { data: rows, degraded } = await getServiceStatus();
  const mine = sortRows(rows.filter((r) => r.service === service));

  if (mine.length === 0) {
    return { text: withFooter(noDataFor(service, lang), lang, degraded), degraded };
  }

  const body = [
    `*${SERVICE_LABELS[lang][service]}*`,
    "",
    mine.map((row) => statusLine(row, lang)).join("\n\n"),
    "",
    `${SITE}/servicios`,
  ].join("\n");

  return { text: withFooter(body, lang, degraded), degraded };
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export async function resourcesReply(
  lang: Lang,
): Promise<{ text: string; degraded: boolean }> {
  const { data: resources, degraded } = await getResources();

  if (resources.length === 0) {
    // The site's empty state, verbatim. Sending someone across a damaged city
    // at night to an address nobody confirmed is the worst thing we could do.
    const body =
      lang === "es"
        ? "Todavía no tenemos albergues ni puntos de ayuda *verificados*.\n\n" +
          "Publicamos una dirección solo cuando una organización la confirma — " +
          "enviar a alguien a un lugar que no existe es peor que no dar " +
          "información.\n\n" +
          `Para ayuda inmediata llama al *123*.\n${SITE}/recursos`
        : "We have no *verified* shelters or aid points yet.\n\n" +
          "We publish an address only once an organisation confirms it — " +
          "sending someone to a place that does not exist is worse than " +
          "giving no information.\n\n" +
          `For immediate help call *123*.\n${SITE}/recursos`;
    return { text: withFooter(body, lang, degraded), degraded };
  }

  const lines = resources.slice(0, 15).map((r) => {
    const parts = [`*${r.name}* — ${RESOURCE_LABELS[lang][r.kind]}`];
    if (r.address) parts.push(r.address);
    if (r.hours) parts.push(r.hours);
    return parts.join("\n  ");
  });

  const more =
    resources.length > 15
      ? lang === "es"
        ? `\n\n+${resources.length - 15} más en ${SITE}/recursos`
        : `\n\n+${resources.length - 15} more at ${SITE}/recursos`
      : `\n\n${SITE}/recursos`;

  const header =
    lang === "es"
      ? "*Puntos verificados*"
      : "*Verified aid points*";

  return {
    text: withFooter(`${header}\n\n${lines.join("\n\n")}${more}`, lang, degraded),
    degraded,
  };
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export async function linksReply(
  lang: Lang,
): Promise<{ text: string; degraded: boolean }> {
  const { data: links, degraded } = await getLinks();

  if (links.length === 0) {
    return {
      text: withFooter(
        lang === "es"
          ? `Todavía no hay enlaces publicados.\n${SITE}/enlaces`
          : `No links published yet.\n${SITE}/enlaces`,
        lang,
        degraded,
      ),
      degraded,
    };
  }

  // `operator` and the non-official badge travel with the link on the site, so
  // they travel with it here too — a bare URL in a crisis is how people end up
  // on lookalike donation domains.
  const lines = links.slice(0, 12).map((l) => {
    const flag = l.source === "official" ? "" : lang === "es"
      ? " · no es un canal oficial"
      : " · not an official channel";
    return `*${l.title}*\n  ${l.url}\n  ${l.operator}${flag}`;
  });

  const header = lang === "es" ? "*Enlaces útiles*" : "*Useful links*";
  const note =
    lang === "es"
      ? "Compara el dominio con el que aparece aquí antes de entregar datos personales."
      : "Compare the domain against the one shown here before entering personal data.";

  return {
    text: withFooter(
      `${header}\n\n${lines.join("\n\n")}\n\n${note}\n${SITE}/enlaces`,
      lang,
      degraded,
    ),
    degraded,
  };
}

export async function missingPersonReply(
  lang: Lang,
): Promise<{ text: string; degraded: boolean }> {
  const { data: links, degraded } = await getLinks();
  const registries = links.filter((l) => l.category === "missing_persons");

  const intro =
    lang === "es"
      ? "*No publicamos nombres de personas desaparecidas* y este sitio no es " +
        "un registro. Usa estos canales y llama al *123*."
      : "*We do not publish names of missing people* and this site is not a " +
        "registry. Use these channels and call *123*.";

  const body =
    registries.length > 0
      ? `${intro}\n\n` +
        registries
          .map((l) => {
            const flag =
              l.source === "official"
                ? ""
                : lang === "es"
                  ? " · no es un canal oficial"
                  : " · not an official channel";
            return `*${l.title}*\n  ${l.url}\n  ${l.operator}${flag}`;
          })
          .join("\n\n")
      : `${intro}\n\n${SITE}/enlaces`;

  return { text: withFooter(body, lang, degraded), degraded };
}

// ---------------------------------------------------------------------------
// Subscription + language
// ---------------------------------------------------------------------------

export function subscribedReply(lang: Lang): string {
  const body =
    lang === "es"
      ? "Listo. Te avisaremos cuando publiquemos algo importante y verificado.\n\n" +
        "No enviamos rumores ni reenvíos: solo lo que confirmamos con la fuente.\n" +
        "Escribe *SALIR* cuando quieras dejar de recibirlos."
      : "Done. We will message you when we publish something important and " +
        "verified.\n\nWe do not send rumours or forwards — only what we " +
        "confirm with the source.\nSend *STOP* to opt out at any time.";
  return withFooter(body, lang);
}

export function unsubscribedReply(lang: Lang): string {
  const body =
    lang === "es"
      ? "Ya no recibirás avisos. Puedes seguir consultando el estado cuando " +
        "quieras escribiendo *ESTADO*.\n\nEscribe *ALERTAS* si cambias de opinión."
      : "You will no longer receive alerts. You can still check the status any " +
        "time by sending *STATUS*.\n\nSend *SUBSCRIBE* if you change your mind.";
  return withFooter(body, lang);
}

export function langChangedReply(lang: Lang): string {
  return helpReply(lang);
}

/**
 * The subscription change did not persist.
 *
 * Never say "done" when it is not. Someone who sends SALIR and is told they
 * are unsubscribed, then keeps receiving broadcasts, has been lied to about
 * the one thing they asked for — and the only honest recovery is to say the
 * change failed and give them a person to reach.
 */
export function subscriptionFailedReply(
  lang: Lang,
  intent: "subscribe" | "unsubscribe",
): string {
  const body =
    lang === "es"
      ? intent === "subscribe"
        ? "No pudimos activar los avisos por un problema técnico. Vuelve a " +
          "escribir *ALERTAS* en un momento."
        : "*No pudimos darte de baja por un problema técnico.* Vuelve a " +
          "escribir *SALIR* en un momento. Si sigues recibiendo mensajes, " +
          "respóndenos y un moderador lo hará manualmente."
      : intent === "subscribe"
        ? "We could not turn alerts on due to a technical problem. Please send " +
          "*SUBSCRIBE* again shortly."
        : "*We could not unsubscribe you due to a technical problem.* Please " +
          "send *STOP* again shortly. If messages keep arriving, reply here " +
          "and a moderator will do it by hand.";
  return withFooter(body, lang);
}

/** A language change that did not persist. Minor, but do not claim success. */
export function langChangeFailedReply(lang: Lang): string {
  const body =
    lang === "es"
      ? "No pudimos guardar tu preferencia de idioma. Inténtalo de nuevo."
      : "We could not save your language preference. Please try again.";
  return withFooter(body, lang);
}

// ---------------------------------------------------------------------------
// Report acknowledgement
// ---------------------------------------------------------------------------

/**
 * What we say when a message has been filed for a moderator.
 *
 * It must not imply the report is published, that anyone is reading it right
 * now, or that help is on the way. Rule 5's obligation runs both ways: the
 * queue implies somebody is reading, so the acknowledgement has to be precise
 * about what has and has not happened.
 */
export function reportFiledReply(lang: Lang): string {
  const body =
    lang === "es"
      ? [
          "Recibimos tu mensaje. Un moderador lo revisará antes de publicar " +
            "cualquier cosa — no aparece en el sitio automáticamente.",
          "",
          "Si puedes, cuéntanos *dónde* (barrio o dirección aproximada) y *a qué " +
            "hora* lo viste. Eso es lo que nos permite verificarlo.",
        ].join("\n")
      : [
          "We received your message. A moderator will review it before anything " +
            "is published — it does not appear on the site automatically.",
          "",
          "If you can, tell us *where* (neighbourhood or rough address) and " +
            "*when* you saw it. That is what lets us verify it.",
        ].join("\n");
  return withFooter(body, lang);
}

/** Too short to file as a report — ask for detail instead of guessing. */
export function tooShortReply(lang: Lang): string {
  const body =
    lang === "es"
      ? "Cuéntanos un poco más para poder revisarlo: qué está pasando, en qué " +
        "barrio y a qué hora lo viste.\n\nEscribe *AYUDA* para ver las opciones."
      : "Tell us a little more so we can review it: what is happening, which " +
        "neighbourhood, and when you saw it.\n\nSend *HELP* for the menu.";
  return withFooter(body, lang);
}

/** Media arrived with no caption — we cannot read the image, so we say so. */
export function mediaOnlyReply(lang: Lang): string {
  const body =
    lang === "es"
      ? "Recibimos tu archivo. Escríbenos también en texto qué muestra, en qué " +
        "barrio y a qué hora — sin eso no podemos verificarlo."
      : "We received your file. Please also tell us in text what it shows, " +
        "which neighbourhood, and when — without that we cannot verify it.";
  return withFooter(body, lang);
}
