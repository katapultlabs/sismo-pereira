import type { ResourceKind, ServiceType, SeverityLevel, SourceKind, StatusLevel } from "./types";

export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "es";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Prefix a path with the locale. Both languages are prefixed (`/es`, `/en`) so
 * there is a single route tree instead of a duplicated one; `/` redirects to
 * the default language.
 */
export function localePath(lang: Lang, path: string): string {
  const clean = path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${clean}`;
}

const es = {
  meta: {
    title: "Sismo Pereira — Información verificada en tiempo real",
    description:
      "Estado de servicios, reportes verificados y recursos de emergencia tras el " +
      "sismo del 10 de agosto de 2026 en Pereira, Risaralda.",
  },
  nav: {
    home: "Inicio",
    services: "Servicios",
    reports: "Reportes",
    resources: "Recursos",
    partners: "Organizaciones",
    submit: "Reportar",
    skipToContent: "Saltar al contenido",
  },
  hero: {
    eyebrow: "Sismo del 10 de agosto de 2026",
    title: "Qué sabemos ahora en Pereira",
    subtitle:
      "Información verificada sobre servicios públicos, daños y recursos de " +
      "emergencia. Cada dato indica su fuente y su hora.",
    emergencyCta: "Líneas de emergencia",
    reportCta: "Reportar una situación",
    quakeSummary:
      "Magnitud 7.4 · 7:34 a. m. · epicentro en Chocó, ~55 km al occidente de " +
      "Pereira · profundidad ~107 km",
  },
  status: {
    heading: "Estado de servicios",
    subheading: "Última información conocida por servicio",
    updated: "Actualizado",
    noData: "Sin datos",
    affected: "usuarios afectados",
    eta: "Restablecimiento estimado",
    viewAll: "Ver detalle por zona",
    source: "Fuente",
    unknownNotice:
      "Los servicios marcados como «sin confirmar» aún no tienen un reporte " +
      "verificado del operador. No asumas que están funcionando ni que están caídos.",
  },
  updates: {
    heading: "Últimas actualizaciones",
    subheading: "Lo que hemos podido confirmar, con su fuente",
    empty: "Todavía no hay actualizaciones publicadas.",
    readMore: "Leer más",
    pinned: "Fijado",
    viewSource: "Ver fuente original",
    backToFeed: "Volver a actualizaciones",
  },
  reports: {
    heading: "Reportes de la comunidad",
    subheading: "Reportes enviados por vecinos y verificados por moderadores",
    empty:
      "Aún no hay reportes verificados. Los reportes aparecen aquí solo después " +
      "de ser confirmados.",
    submitCta: "Enviar un reporte",
    moderationNote:
      "Todo reporte pasa por revisión antes de publicarse. No publicamos datos " +
      "de contacto.",
  },
  form: {
    heading: "Reportar una situación",
    subheading:
      "Cuéntanos qué está pasando en tu zona. Un moderador lo revisará antes de " +
      "publicarlo.",
    emergencyWarning:
      "Si hay vidas en riesgo, llama al 123 antes de llenar este formulario. " +
      "Esta página no es un servicio de emergencia.",
    category: "Tipo de situación",
    categoryPlaceholder: "Selecciona una opción",
    service: "Servicio afectado (opcional)",
    zone: "Zona",
    zonePlaceholder: "Selecciona tu comuna o corregimiento",
    addressHint: "Referencia de ubicación (opcional)",
    addressHintPlaceholder: "Ej. cerca del parque, calle 15 con carrera 8",
    description: "Descripción",
    descriptionPlaceholder:
      "Describe lo que observas: qué pasó, dónde, desde cuándo, si hay personas " +
      "en riesgo.",
    contactHeading: "Contacto (opcional, no se publica)",
    contactNote:
      "Solo lo usamos para verificar el reporte contigo. Nunca aparece en el sitio.",
    contactName: "Nombre",
    contactPhone: "Teléfono",
    submit: "Enviar reporte",
    submitting: "Enviando…",
    successTitle: "Reporte recibido",
    successBody:
      "Gracias. Un moderador lo revisará. Si necesitamos confirmar algo y dejaste " +
      "contacto, te escribiremos.",
    submitAnother: "Enviar otro reporte",
    errorGeneric: "No pudimos enviar el reporte. Intenta de nuevo.",
    required: "Campo obligatorio",
    tooShort: "Escribe al menos 10 caracteres",
  },
  resources: {
    heading: "Recursos de emergencia",
    subheading: "Líneas de atención, albergues y puntos de ayuda verificados",
    linesHeading: "Líneas de emergencia",
    empty:
      "Todavía no tenemos albergues ni puntos de ayuda verificados. Publicamos " +
      "una dirección solo cuando una organización la confirma — enviar a alguien " +
      "a un lugar que no existe es peor que no dar información.",
    capacity: "Capacidad",
    hours: "Horario",
  },
  partners: {
    heading: "Para organizaciones",
    subheading:
      "Empresas de servicios públicos, operadores, entidades y medios pueden " +
      "publicar información directamente.",
    whoHeading: "Quién puede publicar",
    whoBody:
      "Empresas de energía, acueducto, gas, telecomunicaciones y transporte; " +
      "entidades públicas; organismos de socorro y medios verificados.",
    howHeading: "Cómo funciona",
    apiHeading: "API para integraciones",
    apiBody:
      "Si tu organización ya tiene un sistema de monitoreo, puede publicar el " +
      "estado automáticamente con una llave de API.",
    contactHeading: "Solicitar acceso",
    contactBody:
      "Escríbenos con el nombre de tu organización, tu rol y un correo " +
      "institucional para verificarte.",
    steps: [
      "Solicitas acceso y verificamos que representas a la organización.",
      "Recibes una cuenta y, si la necesitas, una llave de API.",
      "Publicas estado de servicios y actualizaciones bajo el nombre de tu organización.",
      "Todo lo que publicas queda atribuido y con marca de tiempo.",
    ],
    orgsHeading: "Organizaciones registradas",
    pendingVerification: "Pendiente de verificar",
    verified: "Verificada",
  },
  footer: {
    disclaimer:
      "Este es un sitio de información comunitaria. No reemplaza los canales " +
      "oficiales ni los servicios de emergencia. Ante una emergencia, llama al 123.",
    sourceCode: "Código abierto",
    lastBuilt: "Actualizado",
  },
  degraded: {
    title: "Mostrando información de respaldo",
    body:
      "No pudimos conectarnos a la base de datos en vivo, así que estás viendo " +
      "el último contenido publicado con el sitio. Puede estar desactualizado.",
  },
  time: {
    justNow: "hace un momento",
    minutesAgo: (n: number) => `hace ${n} min`,
    hoursAgo: (n: number) => `hace ${n} h`,
    daysAgo: (n: number) => `hace ${n} d`,
  },
};

/** English mirrors the Spanish shape exactly, so a missing key is a type error. */
const en: typeof es = {
  meta: {
    title: "Pereira Earthquake — Verified real-time information",
    description:
      "Utility status, verified reports, and emergency resources following the " +
      "August 10, 2026 earthquake in Pereira, Risaralda.",
  },
  nav: {
    home: "Home",
    services: "Services",
    reports: "Reports",
    resources: "Resources",
    partners: "Organizations",
    submit: "Report",
    skipToContent: "Skip to content",
  },
  hero: {
    eyebrow: "August 10, 2026 earthquake",
    title: "What we know right now in Pereira",
    subtitle:
      "Verified information on utilities, damage, and emergency resources. " +
      "Every item shows its source and timestamp.",
    emergencyCta: "Emergency lines",
    reportCta: "Report a situation",
    quakeSummary:
      "Magnitude 7.4 · 7:34 a.m. · epicenter in Chocó, ~55 km west of Pereira · " +
      "depth ~107 km",
  },
  status: {
    heading: "Utility status",
    subheading: "Latest known status by service",
    updated: "Updated",
    noData: "No data",
    affected: "users affected",
    eta: "Estimated restoration",
    viewAll: "View detail by zone",
    source: "Source",
    unknownNotice:
      "Services marked “unconfirmed” have no verified operator report yet. Do " +
      "not assume they are working, or that they are down.",
  },
  updates: {
    heading: "Latest updates",
    subheading: "What we have been able to confirm, with sources",
    empty: "No updates published yet.",
    readMore: "Read more",
    pinned: "Pinned",
    viewSource: "View original source",
    backToFeed: "Back to updates",
  },
  reports: {
    heading: "Community reports",
    subheading: "Reports submitted by neighbours and verified by moderators",
    empty:
      "No verified reports yet. Reports appear here only after they are confirmed.",
    submitCta: "Submit a report",
    moderationNote:
      "Every report is reviewed before publishing. We never publish contact details.",
  },
  form: {
    heading: "Report a situation",
    subheading:
      "Tell us what is happening in your area. A moderator will review it before " +
      "it is published.",
    emergencyWarning:
      "If lives are at risk, call 123 before filling in this form. This page is " +
      "not an emergency service.",
    category: "Type of situation",
    categoryPlaceholder: "Select an option",
    service: "Affected service (optional)",
    zone: "Area",
    zonePlaceholder: "Select your comuna or corregimiento",
    addressHint: "Location reference (optional)",
    addressHintPlaceholder: "e.g. near the park, 15th street at 8th avenue",
    description: "Description",
    descriptionPlaceholder:
      "Describe what you see: what happened, where, since when, whether anyone " +
      "is at risk.",
    contactHeading: "Contact (optional, never published)",
    contactNote:
      "Used only to verify the report with you. It never appears on the site.",
    contactName: "Name",
    contactPhone: "Phone",
    submit: "Submit report",
    submitting: "Sending…",
    successTitle: "Report received",
    successBody:
      "Thank you. A moderator will review it. If we need to confirm something and " +
      "you left contact details, we will reach out.",
    submitAnother: "Submit another report",
    errorGeneric: "We could not send the report. Please try again.",
    required: "Required field",
    tooShort: "Write at least 10 characters",
  },
  resources: {
    heading: "Emergency resources",
    subheading: "Helplines, shelters, and verified aid points",
    linesHeading: "Emergency lines",
    empty:
      "We have no verified shelters or aid points yet. We publish an address only " +
      "once an organization confirms it — sending someone to a place that does not " +
      "exist is worse than giving no information.",
    capacity: "Capacity",
    hours: "Hours",
  },
  partners: {
    heading: "For organizations",
    subheading:
      "Utilities, telecom operators, public agencies, and media can publish " +
      "information directly.",
    whoHeading: "Who can publish",
    whoBody:
      "Electricity, water, gas, telecom, and transport companies; public " +
      "agencies; relief organizations and verified media.",
    howHeading: "How it works",
    apiHeading: "API for integrations",
    apiBody:
      "If your organization already has a monitoring system, it can publish " +
      "status automatically with an API key.",
    contactHeading: "Request access",
    contactBody:
      "Write to us with your organization name, your role, and an institutional " +
      "email so we can verify you.",
    steps: [
      "You request access and we verify you represent the organization.",
      "You receive an account and, if needed, an API key.",
      "You publish service status and updates under your organization's name.",
      "Everything you publish is attributed and timestamped.",
    ],
    orgsHeading: "Registered organizations",
    pendingVerification: "Pending verification",
    verified: "Verified",
  },
  footer: {
    disclaimer:
      "This is a community information site. It does not replace official " +
      "channels or emergency services. In an emergency, call 123.",
    sourceCode: "Open source",
    lastBuilt: "Updated",
  },
  degraded: {
    title: "Showing fallback information",
    body:
      "We could not reach the live database, so you are seeing the last content " +
      "shipped with the site. It may be out of date.",
  },
  time: {
    justNow: "just now",
    minutesAgo: (n: number) => `${n} min ago`,
    hoursAgo: (n: number) => `${n} h ago`,
    daysAgo: (n: number) => `${n} d ago`,
  },
};

const DICTIONARIES = { es, en } as const;
export type Dictionary = typeof es;

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

// ---------------------------------------------------------------------------
// Enum labels
// ---------------------------------------------------------------------------

export const SERVICE_LABELS: Record<Lang, Record<ServiceType, string>> = {
  es: {
    electricity: "Energía",
    water: "Agua",
    gas: "Gas",
    internet: "Internet",
    mobile: "Telefonía móvil",
    transport: "Transporte",
    health: "Salud",
    fuel: "Combustible",
    education: "Educación",
    banking: "Banca",
  },
  en: {
    electricity: "Electricity",
    water: "Water",
    gas: "Gas",
    internet: "Internet",
    mobile: "Mobile network",
    transport: "Transport",
    health: "Health",
    fuel: "Fuel",
    education: "Education",
    banking: "Banking",
  },
};

export const STATUS_LABELS: Record<Lang, Record<StatusLevel, string>> = {
  es: {
    operational: "Funcionando",
    degraded: "Intermitente",
    outage: "Sin servicio",
    restoring: "En restablecimiento",
    unknown: "Sin confirmar",
  },
  en: {
    operational: "Operational",
    degraded: "Degraded",
    outage: "Outage",
    restoring: "Restoring",
    unknown: "Unconfirmed",
  },
};

export const SEVERITY_LABELS: Record<Lang, Record<SeverityLevel, string>> = {
  es: { info: "Información", warning: "Atención", critical: "Crítico" },
  en: { info: "Info", warning: "Warning", critical: "Critical" },
};

export const SOURCE_LABELS: Record<Lang, Record<SourceKind, string>> = {
  es: {
    official: "Fuente oficial",
    social: "Redes sociales",
    private: "Fuente privada",
    media: "Medios",
    community: "Comunidad",
  },
  en: {
    official: "Official source",
    social: "Social media",
    private: "Private source",
    media: "Media",
    community: "Community",
  },
};

export const RESOURCE_LABELS: Record<Lang, Record<ResourceKind, string>> = {
  es: {
    shelter: "Albergue",
    hospital: "Hospital",
    clinic: "Centro de salud",
    aid_point: "Punto de ayuda",
    water_point: "Punto de agua",
    food: "Alimentación",
    charging: "Punto de carga",
    fuel: "Combustible",
    pet_shelter: "Refugio de mascotas",
    info_point: "Punto de información",
    donation_point: "Punto de donación",
  },
  en: {
    shelter: "Shelter",
    hospital: "Hospital",
    clinic: "Health centre",
    aid_point: "Aid point",
    water_point: "Water point",
    food: "Food",
    charging: "Charging point",
    fuel: "Fuel",
    pet_shelter: "Pet shelter",
    info_point: "Information point",
    donation_point: "Donation point",
  },
};

export const REPORT_CATEGORIES = [
  "structural_damage",
  "service_outage",
  "road_blocked",
  "injured_person",
  "missing_person",
  "aid_needed",
  "aid_offered",
  "misinformation",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Lang, Record<ReportCategory, string>> = {
  es: {
    structural_damage: "Daño estructural",
    service_outage: "Falla de servicio público",
    road_blocked: "Vía bloqueada",
    injured_person: "Persona herida",
    missing_person: "Persona desaparecida",
    aid_needed: "Se necesita ayuda",
    aid_offered: "Ofrezco ayuda",
    misinformation: "Información falsa circulando",
    other: "Otro",
  },
  en: {
    structural_damage: "Structural damage",
    service_outage: "Utility outage",
    road_blocked: "Road blocked",
    injured_person: "Injured person",
    missing_person: "Missing person",
    aid_needed: "Aid needed",
    aid_offered: "Offering aid",
    misinformation: "Misinformation spreading",
    other: "Other",
  },
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const LOCALE: Record<Lang, string> = { es: "es-CO", en: "en-GB" };

export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

export function formatTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, lang: Lang, now = Date.now()): string {
  const t = getDictionary(lang).time;
  const diffMs = now - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.hoursAgo(hours);
  return t.daysAgo(Math.floor(hours / 24));
}
