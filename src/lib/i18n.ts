import type {
  LinkCategory,
  LocationSource,
  OutageSince,
  ReportedStatus,
  ResourceKind,
  ServiceType,
  SeverityLevel,
  SourceKind,
  StatusLevel,
} from "./types";

export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "es";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Routes are language-neutral — there is no `/es` or `/en` prefix. The active
 * language comes from the `lang` cookie or the browser locale (see
 * `src/proxy.ts`), so paths are written literally: `/servicios`, `/reportar`.
 */

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
    links: "Enlaces",
    partners: "Organizaciones",
    submit: "Reportar",
    skipToContent: "Saltar al contenido",
    menu: "Menú",
    tagline: "Boletín de situación",
  },
  hero: {
    eyebrow: "Sismo del 10 de agosto de 2026",
    title: "Qué sabemos ahora en Pereira",
    subtitle:
      "Información verificada sobre servicios públicos, daños y recursos de " +
      "emergencia. Cada dato indica su fuente y su hora.",
    emergencyCta: "Líneas de emergencia",
    reportCta: "Reportar una situación",
    /*
     * The same four facts that used to be one run-on sentence, split into
     * labelled fields so the hero can set them as an instrument readout.
     * Values are unchanged — this is a typographic change, not new data.
     */
    quakeFacts: [
      { label: "Magnitud", value: "7.4" },
      { label: "Hora local", value: "7:34 a. m." },
      { label: "Epicentro", value: "Chocó, ~55 km al occidente de Pereira" },
      { label: "Profundidad", value: "~107 km" },
    ],
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
  /*
   * /luz — the electricity reporting instrument.
   *
   * Written for someone standing in a dark house on a phone at 12% battery, so
   * the wording is short, second-person, and free of the word "servicio
   * eléctrico" where "luz" is what people actually say.
   *
   * Two things are said plainly rather than buried: this is not EEP's official
   * channel, and the number you type goes to EEP. See docs/EDITORIAL.md Rule 4.
   */
  luz: {
    metaTitle: "Reportar si hay luz — Sismo Pereira",
    metaDescription:
      "Reporta si tienes luz en tu casa. Estamos reuniendo los reportes de " +
      "toda Pereira para entregárselos a la Empresa de Energía.",
    eyebrow: "Energía",
    title: "¿Hay luz en tu casa?",
    lede:
      "La Empresa de Energía de Pereira perdió el acceso a sus sistemas y está " +
      "restableciendo el servicio casi a ciegas. Tu reporte ayuda a ubicar " +
      "dónde sigue sin haber luz.",
    /* Said before anything is asked, not after it is collected. */
    handoverNotice:
      "Estamos reuniendo estos reportes para entregárselos a la Empresa de " +
      "Energía de Pereira. Tu teléfono y tu ubicación se comparten con ellos " +
      "para que puedan revisar tu sector. No los publicamos en este sitio.",
    notOfficialNotice:
      "Este no es un canal oficial de la Empresa de Energía y no es un " +
      "servicio de emergencia. Reportar aquí no abre un caso ante ellos.",
    /*
     * The banner at the top of the page, before the reporter has told us
     * anything. Distinct from `hazardWarning`, which is what they see *after*
     * saying there is a cable down — that one tells them to stop and call, and
     * as an opening line it would be addressing a situation most readers do
     * not have.
     */
    emergencyWarning:
      "Si hay un cable o un poste caído, o alguien está en peligro, llama al " +
      "123 antes de llenar este formulario. Esta página no es un servicio de " +
      "emergencia.",
    minutes: "Toma menos de un minuto.",

    statusQuestion: "¿Cómo está la luz ahora mismo?",
    statusOutage: "No tengo luz",
    statusDegraded: "Va y viene",
    statusOperational: "Ya tengo luz",
    statusOperationalHint:
      "Reportar que volvió la luz es igual de útil: así saben qué circuitos ya " +
      "quedaron arriba.",

    sinceQuestion: "¿Desde cuándo?",

    locationHeading: "Ubicación",
    locationWhy:
      "Sin ubicación el reporte no le sirve a nadie. Con el GPS es más preciso " +
      "que escribir la dirección.",
    useLocation: "Usar mi ubicación",
    locating: "Ubicando…",
    locationReady: "Ubicación tomada",
    accuracy: "Precisión",
    locationDenied:
      "No nos diste permiso de ubicación. Selecciona tu comuna abajo y, si " +
      "puedes, agrega una referencia.",
    locationUnavailable:
      "No pudimos obtener tu ubicación. Selecciona tu comuna abajo.",
    adjustOnMap: "Ajustar en el mapa",
    hideMap: "Ocultar el mapa",
    mapHint: "Arrastra el mapa para mover el punto al lugar correcto.",
    mapLoading: "Cargando el mapa…",
    mapFailed:
      "No pudimos cargar el mapa. Puedes seguir con la comuna y la referencia.",
    mapAria: "Mapa para ajustar la ubicación del reporte",
    onBehalf: "Estoy reportando por otra persona",
    onBehalfHint:
      "Marca esto si el punto no es donde estás tú. Así saben que el teléfono " +
      "no contesta en esa dirección.",

    hazardHeading: "¿Hay un cable o un poste caído?",
    hazardLabel: "Sí, hay un cable, un poste caído o algo chispeando",
    hazardWarning:
      "Un cable en el suelo puede estar energizado. No te acerques, no lo " +
      "toques y llama al 123 ahora — no esperes a que alguien lea este reporte.",
    hazardCall: "Llamar al 123",

    contactHeading: "Tu teléfono",
    phone: "Teléfono",
    phoneHint:
      "Obligatorio. La Empresa de Energía lo usa para confirmar contigo y para " +
      "no contar dos veces la misma casa. No aparece en el sitio.",
    phoneError: "Escribe un número de teléfono válido.",
    matricula: "Matrícula o número de cuenta (opcional)",
    matriculaHint:
      "Está en tu factura de energía. Con ella pueden ubicar el medidor exacto.",
    note: "Algo más que debamos saber (opcional)",
    notePlaceholder:
      "Ej. el transformador de la esquina hizo un ruido fuerte y se apagó todo " +
      "el bloque.",

    submit: "Enviar reporte",
    submitting: "Enviando…",
    successTitle: "Reporte recibido",
    successBody:
      "Gracias. Queda en el consolidado que le entregamos a la Empresa de " +
      "Energía. Si la luz cambia, vuelve y repórtalo — el reporte más reciente " +
      "de tu número es el que cuenta.",
    submitAnother: "Enviar otro reporte",
    errorGeneric:
      "No pudimos enviar el reporte. Vuelve a intentarlo — no quedó guardado.",
    errorLocation: "Indica tu comuna o comparte tu ubicación.",
    required: "Campo obligatorio",

    densityHeading: "Lo que está reportando la gente",
    densitySubheading: "Hogares que han reportado en las últimas 12 horas",
    densityEmpty:
      "Todavía no hay reportes en las últimas 12 horas. Sé el primero de tu " +
      "sector.",
    densityNotOfficial:
      "Esto es lo que reportan los vecinos, no el estado oficial de la red. " +
      "El estado que publica el operador está en Servicios.",
    households: "hogares",
    householdsOutage: "sin luz",
    householdsDegraded: "intermitente",
    householdsOperational: "con luz",
    hazards: "cables o postes caídos",
    noZone: "Sin comuna indicada",
    lastReport: "Último reporte",
    ctaFromHome: "Reportar si hay luz",
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
    /*
     * A negative list, kept separate from the resource grid on purpose. These
     * are places NOT to go; putting them in the same grid as shelters and aid
     * points would read as a hospital directory at a glance.
     */
    medical: {
      heading: "No acudas a estos centros médicos",
      lede:
        "Estos centros no están recibiendo pacientes. Ir hasta allí cuesta " +
        "tiempo que puede ser crítico y congestiona vías que los organismos de " +
        "socorro necesitan libres.",
      /*
       * Verb and noun phrasings, not adjectives: one label is shared by "la
       * Clínica Los Nevados" and "el Hospital Universitario San Jorge", and an
       * adjective would have to agree with both. "Colapsada … San Jorge" shipped
       * for exactly one render before this comment existed.
       */
      reasons: {
        saturated: "Colapsó por demanda de servicios",
        evacuated: "Desalojo por daños en la infraestructura",
      },
      advice:
        "Si necesitas atención médica urgente, llama al 123 antes de desplazarte.",
      noAlternative:
        "En este corte no se anunciaron centros médicos alternativos. No " +
        "publicamos un destino alterno mientras no lo confirme una fuente oficial.",
      sourceLabel: "Fuente",
      reportedLabel: "Corte",
    },
    linksCta: "Ver enlaces útiles",
  },
  /*
   * The donation drive. Hardcoded rather than a `links` row on purpose: this
   * has to reach production through a deploy and keep working when Supabase
   * does not — see Rule 7. It is also the one outbound link we amplify on
   * every page, so it carries the same apparatus as `/enlaces` (operator,
   * bare domain, an explicit note that we checked the operator and nothing
   * more). Donation scams follow disasters reliably; amplifying a link
   * without printing its domain is how a lookalike gets a free ride.
   */
  donate: {
    eyebrow: "Donaciones",
    barTitle: "Fondo de emergencia para el sismo",
    title: "Dona al fondo de emergencia",
    body:
      "Vaki, la plataforma colombiana de recaudo colectivo, abrió un fondo " +
      "para la emergencia del sismo del 10 de agosto. Recibe aportes desde " +
      "Colombia y desde el exterior.",
    /* Their claim, marked as theirs — we have not audited the disbursement. */
    scope:
      "Según la campaña, los aportes se destinan a organizaciones que operan " +
      "en las zonas afectadas.",
    cta: "Donar",
    verifyNote:
      "Confirmamos quién opera este sitio antes de publicarlo, pero no " +
      "controlamos la campaña ni administramos los fondos. Compara el dominio " +
      "con el de la barra de direcciones antes de donar — durante una " +
      "emergencia circulan copias falsas.",
  },
  links: {
    heading: "Enlaces útiles",
    subheading:
      "Otros sitios donde puedes buscar información o pedir ayuda. No los " +
      "operamos nosotros.",
    empty: "Todavía no hay enlaces publicados.",
    /*
     * Verifying an operator is not the same as vouching for a page's contents,
     * and the difference has to be said out loud: we checked who runs each
     * destination on the day we added it, and nothing more than that.
     */
    externalNotice:
      "Estos sitios pertenecen a otras organizaciones. Confirmamos quién los " +
      "opera antes de publicarlos, pero no controlamos lo que aparece en ellos. " +
      "Compara el dominio con el que mostramos aquí antes de entregar datos " +
      "personales — durante una emergencia circulan copias falsas.",
    missingPersonsNote:
      "Este sitio no es un registro de personas desaparecidas y no publicamos " +
      "nombres. Si estás buscando a alguien, usa estos canales y llama al 123.",
    operator: "Opera",
    notOfficial: "No es un canal oficial",
    newTab: "se abre en una pestaña nueva",
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
  theme: {
    label: "Tema",
    toDark: "Cambiar a modo noche",
    toLight: "Cambiar a modo día",
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
    links: "Links",
    partners: "Organizations",
    submit: "Report",
    skipToContent: "Skip to content",
    menu: "Menu",
    tagline: "Situation bulletin",
  },
  hero: {
    eyebrow: "August 10, 2026 earthquake",
    title: "What we know right now in Pereira",
    subtitle:
      "Verified information on utilities, damage, and emergency resources. " +
      "Every item shows its source and timestamp.",
    emergencyCta: "Emergency lines",
    reportCta: "Report a situation",
    quakeFacts: [
      { label: "Magnitude", value: "7.4" },
      { label: "Local time", value: "7:34 a.m." },
      { label: "Epicenter", value: "Chocó, ~55 km west of Pereira" },
      { label: "Depth", value: "~107 km" },
    ],
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
  luz: {
    metaTitle: "Report whether you have power — Pereira Earthquake",
    metaDescription:
      "Report whether you have electricity at home. We are collecting reports " +
      "across Pereira to hand to the electricity utility.",
    eyebrow: "Electricity",
    title: "Do you have power at home?",
    lede:
      "The Empresa de Energía de Pereira has lost access to its own systems and " +
      "is restoring the grid nearly blind. Your report helps locate where the " +
      "power is still out.",
    handoverNotice:
      "We are collecting these reports to hand to the Empresa de Energía de " +
      "Pereira. Your phone number and location are shared with them so they can " +
      "check your area. We do not publish them on this site.",
    notOfficialNotice:
      "This is not an official channel of the Empresa de Energía, and it is not " +
      "an emergency service. Reporting here does not open a case with them.",
    emergencyWarning:
      "If there is a downed cable or pole, or anyone is in danger, call 123 " +
      "before filling in this form. This page is not an emergency service.",
    minutes: "Takes under a minute.",

    statusQuestion: "How is the power right now?",
    statusOutage: "No power",
    statusDegraded: "Coming and going",
    statusOperational: "Power is back",
    statusOperationalHint:
      "Reporting that your power came back is just as useful: it shows which " +
      "circuits are already up.",

    sinceQuestion: "Since when?",

    locationHeading: "Location",
    locationWhy:
      "Without a location the report is no use to anyone. GPS is more precise " +
      "than typing an address.",
    useLocation: "Use my location",
    locating: "Locating…",
    locationReady: "Location captured",
    accuracy: "Accuracy",
    locationDenied:
      "You did not grant location permission. Pick your comuna below and add a " +
      "landmark if you can.",
    locationUnavailable:
      "We could not get your location. Pick your comuna below.",
    adjustOnMap: "Adjust on the map",
    hideMap: "Hide the map",
    mapHint: "Drag the map to move the pin to the right place.",
    mapLoading: "Loading the map…",
    mapFailed:
      "We could not load the map. You can continue with the comuna and a landmark.",
    mapAria: "Map for adjusting the report location",
    onBehalf: "I am reporting for someone else",
    onBehalfHint:
      "Tick this if the pin is not where you are, so they know the phone will " +
      "not answer at that address.",

    hazardHeading: "Is there a downed cable or pole?",
    hazardLabel: "Yes — a downed cable or pole, or something sparking",
    hazardWarning:
      "A cable on the ground may be live. Stay away, do not touch it, and call " +
      "123 now — do not wait for someone to read this report.",
    hazardCall: "Call 123",

    contactHeading: "Your phone number",
    phone: "Phone",
    phoneHint:
      "Required. The utility uses it to confirm with you and to avoid counting " +
      "the same household twice. It never appears on the site.",
    phoneError: "Enter a valid phone number.",
    matricula: "Account or meter number (optional)",
    matriculaHint:
      "It is on your electricity bill. It lets them locate the exact meter.",
    note: "Anything else we should know (optional)",
    notePlaceholder:
      "e.g. the transformer on the corner made a loud noise and the whole block " +
      "went dark.",

    submit: "Send report",
    submitting: "Sending…",
    successTitle: "Report received",
    successBody:
      "Thank you. It is in the summary we hand to the utility. If your power " +
      "changes, report again — the most recent report from your number is the " +
      "one that counts.",
    submitAnother: "Send another report",
    errorGeneric: "We could not send the report. Try again — nothing was saved.",
    errorLocation: "Choose your comuna or share your location.",
    required: "Required field",

    densityHeading: "What people are reporting",
    densitySubheading: "Households that reported in the last 12 hours",
    densityEmpty:
      "No reports in the last 12 hours yet. Be the first in your area.",
    densityNotOfficial:
      "This is what neighbours report, not the official state of the grid. The " +
      "operator's own status is under Services.",
    households: "households",
    householdsOutage: "no power",
    householdsDegraded: "intermittent",
    householdsOperational: "have power",
    hazards: "downed cables or poles",
    noZone: "No comuna given",
    lastReport: "Last report",
    ctaFromHome: "Report whether you have power",
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
    medical: {
      heading: "Do not go to these medical centres",
      lede:
        "These centres are not receiving patients. Travelling there costs time " +
        "that may be critical and congests roads that rescue crews need clear.",
      reasons: {
        saturated: "Overwhelmed by demand for services",
        evacuated: "Evacuated due to structural damage",
      },
      advice:
        "If you need urgent medical care, call 123 before travelling.",
      noAlternative:
        "No alternative medical centres were announced in this report. We do not " +
        "publish an alternative destination until an official source confirms one.",
      sourceLabel: "Source",
      reportedLabel: "As of",
    },
    linksCta: "See useful links",
  },
  donate: {
    eyebrow: "Donations",
    barTitle: "Earthquake emergency fund",
    title: "Donate to the emergency fund",
    body:
      "Vaki, the Colombian crowdfunding platform, has opened a fund for the " +
      "August 10 earthquake emergency. It accepts donations from inside " +
      "Colombia and from abroad.",
    scope:
      "According to the campaign, contributions go to organizations operating " +
      "in the affected areas.",
    cta: "Donate",
    verifyNote:
      "We confirmed who operates this site before publishing it, but we do " +
      "not control the campaign and do not handle the funds. Check the domain " +
      "against your address bar before donating — fake copies circulate " +
      "during an emergency.",
  },
  links: {
    heading: "Useful links",
    subheading:
      "Other sites where you can look for information or ask for help. We do " +
      "not operate them.",
    empty: "No links published yet.",
    externalNotice:
      "These sites belong to other organizations. We confirm who operates each " +
      "one before publishing it, but we do not control what appears on them. " +
      "Check the domain against the one shown here before entering personal " +
      "details — fake copies circulate during an emergency.",
    missingPersonsNote:
      "This site is not a missing-persons registry and we do not publish names. " +
      "If you are looking for someone, use these channels and call 123.",
    operator: "Operated by",
    notOfficial: "Not an official channel",
    newTab: "opens in a new tab",
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
  theme: {
    label: "Theme",
    toDark: "Switch to night mode",
    toLight: "Switch to day mode",
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

/**
 * Canonical display order, matching the `link_category` enum's declaration
 * order in the migration. The page iterates this rather than trusting the order
 * rows arrive in, so a live query and the offline fallback render identically.
 */
export const LINK_CATEGORIES = [
  "missing_persons",
  "official",
  "seismic",
  "aid",
  "donations",
  "health",
  "transport",
  "media",
] as const satisfies readonly LinkCategory[];

export const LINK_CATEGORY_LABELS: Record<Lang, Record<LinkCategory, string>> = {
  es: {
    missing_persons: "Personas desaparecidas",
    official: "Información oficial",
    seismic: "Información sísmica",
    aid: "Ayuda humanitaria",
    donations: "Donaciones",
    health: "Salud",
    transport: "Transporte",
    media: "Medios",
  },
  en: {
    missing_persons: "Missing persons",
    official: "Official information",
    seismic: "Seismic information",
    aid: "Humanitarian aid",
    donations: "Donations",
    health: "Health",
    transport: "Transport",
    media: "Media",
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
// Service reports (/luz)
//
// Declaration order is display order, and it is deliberate: "no tengo luz" is
// the answer most people are coming to give, so it is the first and largest
// target. Adding a value to the `status_level` check constraint or to the
// `outage_since` enum means adding it here too.
// ---------------------------------------------------------------------------

export const REPORTED_STATUS_OPTIONS = [
  "outage",
  "degraded",
  "operational",
] as const satisfies readonly ReportedStatus[];

/**
 * Resident-facing wording, which is not the operator's wording. The status
 * board says "Sin servicio" because that is how a utility describes its own
 * network; a person in a dark kitchen says "no tengo luz". Same enum value,
 * different voice — do not collapse these into `STATUS_LABELS`.
 */
export const REPORTED_STATUS_LABELS: Record<
  Lang,
  Record<ReportedStatus, string>
> = {
  es: {
    outage: "No tengo luz",
    degraded: "Va y viene",
    operational: "Ya tengo luz",
    unknown: "No sé",
  },
  en: {
    outage: "No power",
    degraded: "Coming and going",
    operational: "Power is back",
    unknown: "Not sure",
  },
};

export const OUTAGE_SINCE_OPTIONS = [
  "since_quake",
  "today",
  "last_hour",
  "unknown",
] as const satisfies readonly OutageSince[];

export const OUTAGE_SINCE_LABELS: Record<Lang, Record<OutageSince, string>> = {
  es: {
    since_quake: "Desde el sismo",
    today: "Se fue hoy, después de haber vuelto",
    last_hour: "En la última hora",
    unknown: "No sé",
  },
  en: {
    since_quake: "Since the earthquake",
    today: "Went out today, after coming back",
    last_hour: "Within the last hour",
    unknown: "Not sure",
  },
};

/** Shown in the operator console so a dispatcher can weigh a pin's precision. */
export const LOCATION_SOURCE_LABELS: Record<
  Lang,
  Record<LocationSource, string>
> = {
  es: {
    gps: "GPS del dispositivo",
    map: "Ubicado en el mapa",
    zone: "Solo comuna",
  },
  en: {
    gps: "Device GPS",
    map: "Placed on the map",
    zone: "Comuna only",
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
