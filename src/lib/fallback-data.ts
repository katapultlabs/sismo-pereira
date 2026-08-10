/**
 * Fallback content used when Supabase is not configured or unreachable.
 *
 * This mirrors `supabase/seed.sql`. It exists so the site stays useful during
 * an outage of our own infrastructure — which, during an earthquake response,
 * is exactly when it is most likely to happen.
 *
 * Editorial rule, same as the seed: reference data is real, operational data
 * is `unknown` rather than invented.
 */

import type {
  Organization,
  PublicReport,
  Resource,
  ServiceStatus,
  Update,
  Zone,
} from "./types";

export const FALLBACK_ZONES: Zone[] = [
  { slug: "pereira", name: "Pereira (todo el municipio)", kind: "municipio" },
  { slug: "centro", name: "Centro", kind: "comuna" },
  { slug: "villa-santana", name: "Villa Santana", kind: "comuna" },
  { slug: "rio-otun", name: "Río Otún", kind: "comuna" },
  { slug: "san-joaquin", name: "San Joaquín", kind: "comuna" },
  { slug: "cuba", name: "Cuba", kind: "comuna" },
  { slug: "el-oso", name: "El Oso", kind: "comuna" },
  { slug: "perla-del-otun", name: "Perla del Otún", kind: "comuna" },
  { slug: "consota", name: "Consotá", kind: "comuna" },
  { slug: "el-rocio", name: "El Rocío", kind: "comuna" },
  { slug: "el-poblado", name: "El Poblado", kind: "comuna" },
  { slug: "san-nicolas", name: "San Nicolás", kind: "comuna" },
  { slug: "olimpica", name: "Olímpica", kind: "comuna" },
  { slug: "ferrocarril", name: "Ferrocarril", kind: "comuna" },
  { slug: "universidad", name: "Universidad", kind: "comuna" },
  { slug: "boston", name: "Boston", kind: "comuna" },
  { slug: "jardin", name: "Jardín", kind: "comuna" },
  { slug: "villavicencio", name: "Villavicencio", kind: "comuna" },
  { slug: "oriente", name: "Oriente", kind: "comuna" },
  { slug: "del-cafe", name: "Del Café", kind: "comuna" },
  { slug: "altagracia", name: "Altagracia", kind: "corregimiento" },
  { slug: "arabia", name: "Arabia", kind: "corregimiento" },
  { slug: "caimalito", name: "Caimalito", kind: "corregimiento" },
  { slug: "cerritos", name: "Cerritos", kind: "corregimiento" },
  { slug: "combia-alta", name: "Combia Alta", kind: "corregimiento" },
  { slug: "combia-baja", name: "Combia Baja", kind: "corregimiento" },
  { slug: "la-bella", name: "La Bella", kind: "corregimiento" },
  { slug: "la-estrella", name: "La Estrella - La Palmilla", kind: "corregimiento" },
  { slug: "morelia", name: "Morelia", kind: "corregimiento" },
  { slug: "puerto-caldas", name: "Puerto Caldas", kind: "corregimiento" },
  { slug: "tribunas-corcega", name: "Tribunas Córcega", kind: "corregimiento" },
  { slug: "dosquebradas", name: "Dosquebradas", kind: "municipio" },
  { slug: "la-virginia", name: "La Virginia", kind: "municipio" },
  { slug: "santa-rosa", name: "Santa Rosa de Cabal", kind: "municipio" },
];

const UNKNOWN_HEADLINE = "Sin confirmación oficial";
const UNKNOWN_DETAIL =
  "Aún no hemos recibido un reporte verificado del operador para este servicio. " +
  "Si representas a la empresa responsable, puedes publicar aquí.";

export const FALLBACK_STATUS: ServiceStatus[] = (
  [
    ["electricity", "Empresa de Energía de Pereira", "EEP", "energia-pereira"],
    ["water", "Aguas y Aguas de Pereira", "Aguas y Aguas", "aguas-y-aguas"],
    ["gas", "Efigas", "Efigas", "efigas"],
    ["internet", null, null, null],
    ["mobile", null, null, null],
    ["transport", "Megabús", "Megabús", "megabus"],
    ["health", null, null, null],
  ] as const
).map(([service, orgName, orgShort, orgSlug], i) => ({
  id: `fallback-status-${service}`,
  service,
  zone_slug: "pereira",
  zone_name: "Pereira (todo el municipio)",
  status: "unknown" as const,
  headline: UNKNOWN_HEADLINE,
  detail: UNKNOWN_DETAIL,
  affected_users: null,
  eta_restored: null,
  source: "official" as const,
  source_url: null,
  reported_at: new Date(Date.UTC(2026, 7, 10, 12, 40 + i)).toISOString(),
  org_name: orgName,
  org_short_name: orgShort,
  org_slug: orgSlug,
}));

export const FALLBACK_UPDATES: Update[] = [
  {
    id: "fallback-update-1",
    slug: "sismo-magnitud-7-4-10-agosto-2026",
    title: "Sismo de magnitud 7.4 con epicentro en Chocó sacude el Eje Cafetero",
    summary:
      "El movimiento se registró a las 7:34 a. m. del 10 de agosto de 2026. " +
      "Pereira es una de las ciudades más afectadas.",
    body:
      "El Servicio Geológico Colombiano reportó un sismo de magnitud 7.4 con " +
      "epicentro en el departamento del Chocó, aproximadamente 55 km al occidente " +
      "de Pereira y a unos 107 km de profundidad.\n\n" +
      "El sismo se sintió en Bogotá, Medellín, Cali y Manizales, y también en " +
      "Ecuador y Panamá.\n\n" +
      "Esta página se actualiza a medida que confirmamos información con fuentes " +
      "oficiales.",
    severity: "critical",
    services: [],
    zone_slugs: ["pereira"],
    source: "media",
    source_name: "Servicio Geológico Colombiano / CNN en Español",
    source_url:
      "https://cnnespanol.cnn.com/2026/08/10/colombia/terremoto-sismo-san-jose-choco-orix",
    pinned: true,
    published_at: "2026-08-10T12:50:00Z",
  },
  {
    id: "fallback-update-2",
    slug: "afectaciones-estructurales-pereira",
    title: "Reportan daños estructurales en varios edificios de Pereira",
    summary:
      "Medios nacionales reportan colapsos parciales y daños en edificaciones. " +
      "El aeropuerto Matecaña resultó afectado.",
    body:
      "Se reportan daños graves en varias edificaciones de Pereira. La cubierta " +
      "de la terminal aérea del Aeropuerto Internacional Matecaña resultó afectada.\n\n" +
      "**No ingreses a edificaciones con daño visible** hasta que sean evaluadas " +
      "por personal técnico. Reporta estructuras en riesgo a través de esta página " +
      "o a la línea de emergencias 123.",
    severity: "critical",
    services: ["transport"],
    zone_slugs: ["pereira", "centro"],
    source: "media",
    source_name: "El Tiempo",
    source_url:
      "https://www.eltiempo.com/colombia/otras-ciudades/temblor-en-colombia-deja-graves-afectaciones-en-manizales-catedral-y-varios-edificios-afectados-escombros-y-heridos-3577256",
    pinned: true,
    published_at: "2026-08-10T13:10:00Z",
  },
  {
    id: "fallback-update-3",
    slug: "fallas-energia-telefonia",
    title: "Fallas de energía y telefonía en Pereira, Manizales y Cali",
    summary:
      "Las empresas del sector eléctrico revisan redes de distribución. No se " +
      "reportan daños en plantas de generación térmica.",
    body:
      "El sector eléctrico colombiano reportó afectaciones en la distribución del " +
      "servicio tras el sismo, sin daños en plantas de generación térmica. Las " +
      "empresas revisan las redes de distribución en Manizales, Pereira y Cali para " +
      "identificar daños y restablecer el servicio.\n\n" +
      "También se reportan intermitencias en servicios de telefonía y comunicaciones.\n\n" +
      "**Usa mensajes de texto o datos en lugar de llamadas** para liberar capacidad " +
      "de la red.",
    severity: "warning",
    services: ["electricity", "mobile", "internet"],
    zone_slugs: ["pereira"],
    source: "media",
    source_name: "Yahoo Noticias",
    source_url:
      "https://es-us.noticias.yahoo.com/manizales-pereira-cali-reportan-fallas-151409974.html",
    pinned: false,
    published_at: "2026-08-10T13:25:00Z",
  },
];

export const FALLBACK_ORGS: Organization[] = [
  {
    id: "fallback-org-1",
    slug: "energia-pereira",
    name: "Empresa de Energía de Pereira",
    short_name: "EEP",
    type: "utility",
    services: ["electricity"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-2",
    slug: "aguas-y-aguas",
    name: "Aguas y Aguas de Pereira",
    short_name: "Aguas y Aguas",
    type: "utility",
    services: ["water"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-3",
    slug: "efigas",
    name: "Efigas",
    short_name: "Efigas",
    type: "utility",
    services: ["gas"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-4",
    slug: "claro",
    name: "Claro Colombia",
    short_name: "Claro",
    type: "telco",
    services: ["mobile", "internet"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-5",
    slug: "movistar",
    name: "Movistar Colombia",
    short_name: "Movistar",
    type: "telco",
    services: ["mobile", "internet"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-6",
    slug: "tigo",
    name: "Tigo Colombia",
    short_name: "Tigo",
    type: "telco",
    services: ["mobile", "internet"],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-7",
    slug: "alcaldia-pereira",
    name: "Alcaldía de Pereira",
    short_name: "Alcaldía",
    type: "government",
    services: [],
    website: null,
    logo_url: null,
    verified: false,
  },
  {
    id: "fallback-org-8",
    slug: "cruz-roja-risaralda",
    name: "Cruz Roja Colombiana — Seccional Risaralda",
    short_name: "Cruz Roja",
    type: "ngo",
    services: ["health"],
    website: null,
    logo_url: null,
    verified: false,
  },
];

/**
 * No fabricated shelters or aid points. Publishing an address where someone
 * might drive at night looking for help, that turns out not to exist, is the
 * single worst failure mode this site has. These get populated only from
 * verified partner submissions.
 */
export const FALLBACK_RESOURCES: Resource[] = [];

export const FALLBACK_REPORTS: PublicReport[] = [];

/**
 * National emergency lines. These are stable, published, country-wide numbers.
 */
export const EMERGENCY_LINES = [
  { label: "Línea única de emergencias", number: "123" },
  { label: "Bomberos", number: "119" },
  { label: "Cruz Roja", number: "132" },
  { label: "Defensa Civil", number: "144" },
  { label: "Policía Nacional", number: "112" },
] as const;
