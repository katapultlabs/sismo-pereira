import type { Lang } from "../i18n";
import type { ServiceType } from "../types";

/**
 * What an inbound message asked for.
 *
 * Deliberately a small, closed set. This is not a chatbot and must never
 * appear to be one: it answers a handful of questions from data the site
 * already publishes, and files everything else for a human to read. Anything
 * cleverer would be a machine inventing crisis information, which
 * `docs/EDITORIAL.md` Rule 8 forbids outright.
 */
export type Command =
  | { kind: "help" }
  | { kind: "status_all" }
  | { kind: "status_service"; service: ServiceType }
  | { kind: "resources" }
  | { kind: "links" }
  | { kind: "missing_person" }
  | { kind: "subscribe" }
  | { kind: "unsubscribe" }
  | { kind: "set_lang"; lang: Lang }
  | { kind: "emergency" }
  | { kind: "report" };

/** Lowercase, strip accents, collapse whitespace, drop trailing punctuation. */
export function normalise(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?¿¡,;:]+$/g, "");
}

const SERVICE_KEYWORDS: Record<string, ServiceType> = {
  agua: "water",
  acueducto: "water",
  water: "water",
  luz: "electricity",
  energia: "electricity",
  electricidad: "electricity",
  electricity: "electricity",
  power: "electricity",
  gas: "gas",
  internet: "internet",
  wifi: "internet",
  senal: "mobile",
  celular: "mobile",
  movil: "mobile",
  telefono: "mobile",
  mobile: "mobile",
  signal: "mobile",
  transporte: "transport",
  transport: "transport",
  bus: "transport",
  megabus: "transport",
  vias: "transport",
  salud: "health",
  hospital: "health",
  hospitales: "health",
  health: "health",
  gasolina: "fuel",
  combustible: "fuel",
  fuel: "fuel",
  colegio: "education",
  colegios: "education",
  educacion: "education",
  clases: "education",
  education: "education",
  banco: "banking",
  bancos: "banking",
  banking: "banking",
};

const EXACT: Array<[readonly string[], Command]> = [
  [
    ["ayuda", "help", "menu", "hola", "buenas", "info", "?", "0", "start", "inicio"],
    { kind: "help" },
  ],
  [
    ["estado", "status", "servicios", "services", "1"],
    { kind: "status_all" },
  ],
  [
    [
      "albergues", "albergue", "refugio", "refugios", "recursos", "ayuda humanitaria",
      "shelter", "shelters", "resources", "2",
    ],
    { kind: "resources" },
  ],
  [["enlaces", "links", "sitios", "3"], { kind: "links" }],
  [
    [
      "desaparecido", "desaparecidos", "desaparecida", "buscar persona",
      "missing", "missing person",
    ],
    { kind: "missing_person" },
  ],
  [
    // Keywords are matched post-`normalise`, so they are written unaccented.
    ["alertas", "alerta", "suscribir", "suscribirme", "subscribe", "si"],
    { kind: "subscribe" },
  ],
  [
    ["salir", "baja", "stop", "cancelar", "parar", "unsubscribe", "no mas", "basta"],
    { kind: "unsubscribe" },
  ],
  [["en", "english", "ingles"], { kind: "set_lang", lang: "en" }],
  [["es", "espanol", "spanish", "castellano"], { kind: "set_lang", lang: "es" }],
  [["123", "emergencia", "emergency", "urgente", "sos"], { kind: "emergency" }],
];

/**
 * Match an inbound body to a command.
 *
 * Matching is exact on the normalised string, not fuzzy and not substring —
 * "no hay agua en la 30 desde anoche" must be filed as a report for a human to
 * read, not silently answered with a canned water bulletin. Only someone who
 * typed the single word "agua" gets the automated answer.
 */
export function parseCommand(body: string): Command {
  const text = normalise(body);
  if (!text) return { kind: "help" };

  for (const [keywords, command] of EXACT) {
    if (keywords.includes(text)) return command;
  }

  const service = SERVICE_KEYWORDS[text];
  if (service) return { kind: "status_service", service };

  return { kind: "report" };
}

/** Stable label for `whatsapp_messages.handled_as`, for auditing the router. */
export function commandLabel(command: Command): string {
  switch (command.kind) {
    case "status_service":
      return `status_service:${command.service}`;
    case "set_lang":
      return `set_lang:${command.lang}`;
    default:
      return command.kind;
  }
}
