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
    /* Two sentences became one. The first restated the site's scope, which the
       action board below now demonstrates rather than announces; the second is
       the promise nobody else makes, and it earns the line on its own. */
    subtitle: "Cada dato que publicamos indica su fuente y su hora.",
    /* `emergencyCta` labels the 123 button in the masthead and on /reportar.
       The matching `reportCta` went with the hero buttons the action board
       replaced — the board names that route itself, in `actions.report`. */
    emergencyCta: "Líneas de emergencia",
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
  /*
   * The action board — the hub that occupies the fold.
   *
   * Every tile names an action the reader takes ("Llama al 123", "Busca a una
   * persona"), never a section of the site ("Emergencias", "Enlaces"). A tile
   * that names a destination is a nav link; a tile that names an action is a
   * decision already made for someone who is scared and scrolling fast.
   */
  actions: {
    heading: "Qué necesitas ahora",
    subheading: "Los accesos más usados, con lo último que sabemos de cada uno.",
    emergency: {
      eyebrow: "Emergencias",
      title: "Llama al 123",
      body:
        "Vidas en riesgo, personas heridas, incendios o rescates. Línea única " +
        "nacional, gratuita desde cualquier teléfono.",
    },
    medical: {
      eyebrow: "Salud",
      title: "No acudas a estos centros médicos",
      body: "No están recibiendo pacientes. Llama al 123 antes de desplazarte.",
      count: (n: number) => `${n} centros`,
      cta: "Ver el detalle y la fuente",
    },
    services: {
      eyebrow: "Servicios públicos",
      title: "Mira el estado de tu servicio",
      body: "Energía, agua, gas, internet y transporte, zona por zona.",
    },
    report: {
      eyebrow: "Reportar",
      title: "Cuenta qué está pasando",
      body: "Daños, fallas de servicio, vías bloqueadas o ayuda que se necesita.",
      meta: "Lo revisa un moderador",
    },
    missing: {
      eyebrow: "Búsqueda",
      title: "Busca a una persona",
      body: "Canales oficiales de búsqueda. Aquí no publicamos nombres.",
      meta: "Sitios de otras organizaciones",
    },
    resources: {
      eyebrow: "Recursos",
      title: "Líneas, albergues y ayuda",
      body: "Todos los números de emergencia y los puntos de ayuda verificados.",
      meta: (n: number) => `${n} líneas de emergencia`,
    },
    community: {
      eyebrow: "Comunidad",
      title: "Lee los reportes de vecinos",
      body: "Lo que reporta la gente, publicado solo después de confirmarse.",
      meta: (n: number) =>
        n === 1 ? "1 reporte verificado" : `${n} reportes verificados`,
      metaEmpty: "Aún sin reportes verificados",
    },
    orgs: {
      eyebrow: "Organizaciones",
      title: "Publica información oficial",
      body:
        "Empresas de servicios públicos, entidades y organismos de socorro " +
        "publican directamente aquí.",
      meta: "Con cuenta o llave de API",
    },
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
    pinnedHeading: "Avisos fijados",
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
    /* The other half of the question: this grid answers "where do I go for
       help", the goods half of `/donar` answers "where do I take what I
       have". */
    collectionCta: "Ver puntos de acopio",
  },
  /*
   * Donations in kind — the physical counterpart to `/donar`.
   *
   * The list of needs is the load-bearing part, not the address. A collection
   * point published as a name and an opening time produces a lorry of donated
   * clothing nobody asked for while the gauze runs out, so `needsHeading`
   * outranks `address` in the card and the empty-needs state says "ask" rather
   * than implying anything is welcome.
   */
  /*
   * Donations in kind. Rendered as the second half of `/donar`, not as its
   * own route — "quiero donar" is one intent, and splitting it across two
   * URLs modelled our schema instead of the reader (see DECISIONS).
   */
  collection: {
    heading: "Puntos de acopio",
    lede:
      "Estos son los puntos confirmados por la organización que los opera. " +
      "Llevar lo que sí están pidiendo es lo que hace útil una donación en " +
      "especie.",
    needsHeading: "Qué están pidiendo",
    noNeeds:
      "Este punto no ha publicado una lista. Pregunta antes de llevar algo.",
    hours: "Horario",
    address: "Dónde",
    phone: "Teléfono",
    sourceLabel: "Fuente",
    updatedLabel: "Confirmado",
    /*
     * Rule 2, in the words of the specific failure this page invites: a
     * forwarded WhatsApp broadcast announcing a collection point is the most
     * shareable and least verifiable object in a disaster.
     */
    empty:
      "Todavía no tenemos ningún punto de acopio confirmado por la " +
      "organización que lo opera. Publicamos una dirección solo cuando la " +
      "confirma un canal oficial de esa organización — los mensajes " +
      "reenviados sobre puntos de acopio circulan más rápido que cualquier " +
      "otra cosa después de un sismo, y no todos son ciertos.",
    /* Standard logistics advice, not a claim about any particular site. */
    beforeYouGo: {
      heading: "Antes de salir",
      items: [
        "Confirma el horario con la organización. Un punto de acopio abre y " +
          "cierra según la bodega que tenga disponible.",
        "Lleva solo lo que está en la lista. Lo que no se pidió ocupa manos y " +
          "espacio que hacen falta para lo que sí.",
        "Empaca por tipo y marca las cajas. Clasificar en el punto es el " +
          "cuello de botella, no recibir.",
        "Revisa fechas de vencimiento y que lo textil vaya nuevo o limpio.",
      ],
    },
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
    /* Every internal CTA lands here first. One audited exit point means the
     * disclosure and the verification are read before anyone leaves the site,
     * rather than after. */
    learnMore: "Por qué este fondo",
    blockNote:
      "Antes de aportar, revisa qué verificamos, qué afirma la campaña y qué " +
      "todavía no es público.",
    page: {
      heading: "Donar",
      /* The page asks one question and answers it with two doors. Everything
         else on it is subordinate to that. */
      lede: "Hay dos formas de ayudar. Elige la tuya.",
      checkedOn: "Revisado el 11 de agosto de 2026",

      /* The two doors. Each carries a live readout, the same rule the home
         page's route tiles follow — a choice card with no readout is a nav
         link wearing a plate. */
      moneyChoice: {
        title: "Dinero",
        body: "Al fondo de emergencia. Se puede aportar desde Colombia o desde el exterior.",
        readout: "Fondo de emergencia",
      },
      goodsChoice: {
        title: "Cosas",
        body: "A un punto de acopio. Cada uno publica qué está pidiendo.",
        readout: (n: number) =>
          n === 1 ? "1 punto de acopio" : `${n} puntos de acopio`,
        readoutEmpty: "Aún sin puntos confirmados",
      },

      moneyHeading: "Donar dinero",
      goodsHeading: "Donar cosas",

      /*
       * The verification dossier is collapsed behind this. It used to be
       * three full sections above the fold, which made the page read as an
       * argument rather than an action — see DECISIONS. The *disclosure* is
       * not in here: Rule 10 requires the investment stake to sit in the
       * body at full size, and it still does.
       */
      trustSummary: "¿Por qué deberías confiar en esto?",
      trustLede:
        "Lo que comprobamos, lo que solo afirma la campaña, y lo que todavía " +
        "no es público. Están separados a propósito.",

      actionTitle: "Aportar a la campaña",
      actionBody:
        "La campaña ofrece tres rutas de pago: donación deducible de " +
        "impuestos desde Estados Unidos, donación internacional, y pago en " +
        "pesos con métodos locales colombianos. Todas se procesan con Stripe.",

      /*
       * The one-glance answer, printed above the dossier.
       *
       * Someone deciding whether to give does not want four bordered cards and
       * three dashed boxes first; they want to know which parts of this have
       * been checked and which have not. So the page says that in two lines
       * and keeps the evidence behind the expander for whoever wants it.
       *
       * This compresses Rule 10's separation of findings from gaps — it does
       * not soften it. "Sin verificar" is set at the same size, in the same
       * container, as "Verificado"; a summary that printed only the reassuring
       * half would be exactly the merged-confident-block failure Rule 10
       * forbids.
       */
      checks: {
        yes: "Verificado",
        no: "Sin verificar",
        verified:
          "Quién opera la campaña. Vaki es una plataforma colombiana con " +
          "años de operación, la campaña vive en su propio dominio y los " +
          "pagos se procesan con Stripe.",
        unverified:
          "A dónde llega el dinero. La campaña todavía no publica las " +
          "organizaciones que reciben, un informe de desembolsos, ni qué " +
          "parte del aporte se va en comisiones.",
      },

      verifiedHeading: "Qué verificamos nosotros",
      verifiedLede:
        "Lo que comprobamos por nuestra cuenta, con la fuente al lado. No " +
        "auditamos la campaña: verificamos quién está detrás de ella.",
      verified: [
        {
          title: "Vaki es una plataforma establecida, no creada para esta emergencia",
          detail:
            "Opera desde Colombia desde hace años, ha recaudado más de USD $11 " +
            "millones de cerca de 500.000 aportantes y se expandió a México. Su " +
            "campaña más conocida recaudó USD $1,1 millones de 23.651 personas.",
          source: "Crunchbase, Tracxn, Contxto",
        },
        {
          title: "La campaña vive en el dominio propio de Vaki",
          detail:
            "helpcolombia.vaki.org es un subdominio de vaki.org. No es un " +
            "dominio parecido registrado después del sismo, que es la forma " +
            "más común de fraude tras un desastre.",
          source: "Verificación directa del dominio",
        },
        {
          title: "Hay una entidad estadounidense dedicada, con personas con nombre propio",
          detail:
            "Vaki Foundation publica una dirección en Miami, Florida, y tres " +
            "fundadores identificados: Nicolás Contreras, Raissa Joao y " +
            "Ricardo Mejía.",
          source: "vaki.org",
        },
        {
          title: "Los pagos se procesan con Stripe",
          detail:
            "No se piden datos de tarjeta en un formulario propio: el cobro " +
            "ocurre en la pasarela de Stripe, que es un procesador " +
            "internacional conocido.",
          source: "helpcolombia.vaki.org",
        },
      ],

      claimsHeading: "Qué dice la campaña",
      claimsLede:
        "Afirmaciones de la propia campaña. Las reproducimos porque son " +
        "relevantes, y las marcamos como suyas porque no las comprobamos.",
      claims: [
        {
          title: "Se describe como una entidad sin ánimo de lucro 501(c)(3) de EE. UU.",
          detail:
            "Sobre esa base ofrece deducción tributaria a donantes " +
            "estadounidenses.",
        },
        {
          title: "Dice que los fondos van a organizaciones verificadas en las zonas afectadas",
          detail:
            "No nombra cuáles ni publica el criterio con el que las verifica.",
        },
        {
          title: "Se compromete a registrar y publicar cada desembolso",
          detail:
            "Es un compromiso a futuro, no un reporte que hoy puedas revisar.",
        },
      ],

      gapsHeading: "Qué todavía no es público",
      gapsLede:
        "Ninguna de estas cosas indica que algo esté mal. Son los datos que " +
        "aún no pudimos consultar, y son las preguntas que vale la pena hacer " +
        "a cualquier campaña, incluida esta.",
      gaps: [
        "El número de identificación tributaria (EIN) no está publicado, así " +
          "que no pudimos confirmar el estatus 501(c)(3) en un registro " +
          "independiente. La propia Vaki Foundation recomienda consultar a un " +
          "asesor tributario antes de asumir la deducción.",
        "A la fecha de esta revisión no había todavía un informe de " +
          "desembolsos publicado que se pudiera consultar.",
        "No se publican las organizaciones receptoras ni qué porcentaje del " +
          "aporte se destina a comisiones de plataforma o de procesamiento.",
      ],

      /*
       * Rule 10, requirement 2 — stated about the site rather than about a
       * person. The disclosure itself is not negotiable and has not moved or
       * shrunk; only the grammar changed. Naming an individual made a reader
       * stop and work out who that was and whether it mattered, which is
       * cognitive load spent on the wrong question: what they need is the
       * relationship, not the biography.
       */
      disclosureHeading: "Declaración de interés",
      disclosureBody:
        "Hay un conflicto de interés en esta recomendación: este sitio está " +
        "vinculado a Vaki —la plataforma que opera la campaña— por una " +
        "participación como inversionista. Va aquí, y no en una nota al pie, " +
        "porque es exactamente el tipo de dato que deberías conocer antes de " +
        "decidir.",

      /*
       * Rule 9 in its hardest form: a personal fundraiser, on a platform that
       * will host anyone, which reached us through a personal connection
       * rather than an official channel. Everything that makes it publishable
       * is on the card — who organizes it, the bare domain, what could be
       * checked, what could not, and how it got here.
       *
       * The published URL is the canonical `gofundme.com` one, never the
       * `gofund.me` shortener it arrived as. A shortened link hides the exact
       * domain Rule 9 prints for the reader to compare against the address
       * bar, which would defeat the check on the page that needs it most.
       */
      otherRegions: {
        heading: "Ayudar a otra región",
        lede:
          "El sismo no se detuvo en Risaralda. Si quieres que tu aporte " +
          "llegue a otra zona golpeada, esta es la campaña que revisamos.",
        place: "Buenaventura, Valle del Cauca",
        campaignTitle: "Earthquake Relief for Buenaventura, Colombia",
        /* Its own date, not the page's: this card was checked a day after the
           Vaki dossier, and Rule 3 dates the claim, not the page. */
        reviewedOn: "Revisado el 12 de agosto de 2026",
        context:
          "El puerto quedó aislado por tres derrumbes en la vía a " +
          "Loboguerrero y Buga, con la red hospitalaria al límite y " +
          "calamidad pública declarada. El alcalde dijo que «el terremoto " +
          "desbordó todas las capacidades» del distrito.",
        contextSource: "El Tiempo, La Silla Vacía",
        organizerLabel: "Organiza",
        organizer: "Catalina García Cure, desde Fort Lauderdale (EE. UU.)",
        verified:
          "El enlace lleva a una campaña real alojada en gofundme.com, con " +
          "una persona identificada al frente y una organización receptora " +
          "con nombre: la Patrulla Aérea Civil Colombiana.",
        unverified:
          "Es un recaudo personal, no una entidad auditada. Los fondos " +
          "entran a una cuenta particular en Estados Unidos antes de llegar " +
          "a Colombia, y no hay un informe de gastos que puedas revisar.",
        relation:
          "Este enlace no llegó por un canal oficial sino por una relación " +
          "personal con quien organiza la campaña. Lo decimos por la misma " +
          "razón que declaramos todo lo demás en esta página.",
        cta: "Ver la campaña",
      },

      alternativesHeading: "No es el único canal",
      alternativesBody:
        "La Cruz Roja Colombiana y otros canales oficiales también reciben " +
        "donaciones para la emergencia. Los listamos junto a este, con el " +
        "mismo detalle de quién los opera.",
      alternativesCta: "Ver todos los canales",
    },
  },
  /*
   * The verification standard, in one place.
   *
   * This exists because the site sends people somewhere — a car park, a
   * payment form, a registry — and "verificado" was doing a lot of unexamined
   * work on those cards. A reader could see the badge and the date and still
   * not know what had actually been checked.
   *
   * It also replaced a worse answer. Cards used to credit the person who did
   * the checking by name, which reads as a personal vouch: it asks the reader
   * to decide whether they trust a stranger, which is not a question they can
   * answer and not the one that matters. The method and the date are the
   * useful facts, so the cards now name the site and link here.
   */
  verification: {
    heading: "Cómo verificamos",
    /* The link on a card. Short, because it sits in a mono metadata row
       beside the source and the date. */
    cardLink: "Cómo verificamos",
    lede:
      "Este sitio manda gente a lugares: puntos de acopio, campañas de " +
      "donación, registros para buscar a alguien. Esto es lo que " +
      "comprobamos antes de publicar uno — y lo que no.",

    meansHeading: "Qué quiere decir «verificado» aquí",
    meansBody:
      "Que en la fecha que aparece en la ficha confirmamos tres cosas: que " +
      "el lugar existe, que lo opera quien decimos, y que recibe a quien " +
      "llegue. No quiere decir que respondamos por lo que ocurra allí, ni " +
      "que hayamos revisado sus cuentas.",

    checksHeading: "Qué comprobamos antes de publicar",
    checks: [
      {
        title: "Que se pueda nombrar a quien lo opera",
        detail:
          "Si no podemos decir qué organización está detrás de un lugar, no " +
          "lo hemos comprobado lo suficiente como para mandarte allá.",
      },
      {
        title: "Que un desconocido pueda entrar",
        detail:
          "Varios de estos sitios están dentro de clubes, conjuntos o " +
          "edificios de oficinas. Que circule «estamos recibiendo " +
          "donaciones» entre sus miembros no significa que dejen pasar a " +
          "cualquiera. Lo preguntamos explícitamente.",
      },
      {
        title: "Que la dirección lleve a una puerta y no a un edificio",
        detail:
          "«Viva Cerritos» te dice a qué construcción ir; «el parqueadero » " +
          "te dice dónde parar el carro. Si sólo tenemos el edificio, " +
          "dejamos la dirección vacía en lugar de inventar una entrada.",
      },
      {
        title: "Que el dominio sea el de la organización",
        detail:
          "Un dominio parecido, registrado después del sismo, es la forma " +
          "más común de fraude tras un desastre. Por eso cada ficha imprime " +
          "el dominio: para que lo compares con la barra de direcciones.",
      },
      {
        title: "Que el dinero pase por una pasarela conocida",
        detail:
          "Si una campaña pide los datos de la tarjeta en un formulario " +
          "propio en vez de un procesador reconocido, no la publicamos.",
      },
    ],

    limitsHeading: "Qué no comprobamos",
    limitsLede:
      "Decirlo es parte del método. Una verificación que no declara sus " +
      "límites se lee como una garantía, y no lo es.",
    limits: [
      "No auditamos a nadie. No vemos sus cuentas, ni sus contratos, ni a " +
        "dónde va cada peso después de que lo entregas.",
      "No comprobamos lo que un sitio publica, sólo quién lo opera. Que " +
        "confirmemos que una página es de la Cruz Roja no nos hace " +
        "responsables de lo que diga esa página mañana.",
      "No lo volvemos a mirar solo. Cada ficha lleva la fecha en que se " +
        "revisó, y un punto de acopio puede cerrar en horas. La fecha es " +
        "parte del dato, no un adorno.",
    ],

    badgeHeading: "Por qué algunas fichas dicen «No es un canal oficial»",
    badgeBody:
      "Porque quien lo opera no es una autoridad ni la organización " +
      "responsable de esa tarea, sino un vecino, una empresa o una " +
      "iniciativa particular. No quiere decir que sea falso — varios de los " +
      "puntos de acopio de esta ciudad son exactamente eso — pero sí que no " +
      "tiene detrás la obligación de responder que tiene un canal oficial.",

    whoHeading: "Quién lo hace",
    whoBody:
      "La redacción de este sitio, no una persona a la que tengas que " +
      "conocer. Por eso las fichas dicen «sismopereira.org» y no un nombre " +
      "propio: un nombre te pide decidir si confías en un desconocido, que " +
      "no es una pregunta que puedas responder. Lo que sí te sirve para " +
      "decidir es el método y la fecha, y los dos están aquí.",

    wrongHeading: "Si algo de esto está mal",
    wrongBody:
      "Si un punto cerró, cambió de horario o nunca recibió a nadie, " +
      "dínoslo. Corregir un dato viejo importa tanto como publicar uno " +
      "nuevo: un punto de acopio que cerró esta mañana manda a alguien a " +
      "un viaje perdido con el carro lleno.",
    wrongCta: "Enviar un reporte",
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
    subtitle: "Every item we publish shows its source and its time.",
    emergencyCta: "Emergency lines",
    quakeFacts: [
      { label: "Magnitude", value: "7.4" },
      { label: "Local time", value: "7:34 a.m." },
      { label: "Epicenter", value: "Chocó, ~55 km west of Pereira" },
      { label: "Depth", value: "~107 km" },
    ],
  },
  actions: {
    heading: "What do you need right now",
    subheading: "The most-used routes, each showing the latest we know.",
    emergency: {
      eyebrow: "Emergencies",
      title: "Call 123",
      body:
        "Lives at risk, injured people, fires, or rescues. National single " +
        "emergency line, free from any phone.",
    },
    medical: {
      eyebrow: "Health",
      title: "Do not go to these medical centres",
      body: "They are not receiving patients. Call 123 before travelling.",
      count: (n: number) => `${n} centres`,
      cta: "See the detail and the source",
    },
    services: {
      eyebrow: "Utilities",
      title: "Check your service status",
      body: "Electricity, water, gas, internet, and transport, area by area.",
    },
    report: {
      eyebrow: "Report",
      title: "Tell us what is happening",
      body: "Damage, utility failures, blocked roads, or aid that is needed.",
      meta: "Reviewed by a moderator",
    },
    missing: {
      eyebrow: "Search",
      title: "Look for a person",
      body: "Official search channels. We do not publish names here.",
      meta: "Sites run by other organizations",
    },
    resources: {
      eyebrow: "Resources",
      title: "Helplines, shelters, and aid",
      body: "Every emergency number and the verified aid points.",
      meta: (n: number) => `${n} emergency lines`,
    },
    community: {
      eyebrow: "Community",
      title: "Read reports from neighbours",
      body: "What people report, published only after it is confirmed.",
      meta: (n: number) =>
        n === 1 ? "1 verified report" : `${n} verified reports`,
      metaEmpty: "No verified reports yet",
    },
    orgs: {
      eyebrow: "Organizations",
      title: "Publish official information",
      body:
        "Utilities, public agencies, and relief organizations publish here " +
        "directly.",
      meta: "With an account or an API key",
    },
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
    pinnedHeading: "Pinned notices",
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
    collectionCta: "See collection points",
  },
  collection: {
    heading: "Collection points",
    lede:
      "These are the points confirmed by the organization that runs them. " +
      "Bringing what they actually asked for is what makes a donation in " +
      "kind useful.",
    needsHeading: "What they are asking for",
    noNeeds:
      "This point has not published a list. Ask before bringing anything.",
    hours: "Hours",
    address: "Where",
    phone: "Phone",
    sourceLabel: "Source",
    updatedLabel: "Confirmed",
    empty:
      "We have no collection point confirmed by the organization that runs " +
      "it yet. We publish an address only once an official channel of that " +
      "organization confirms it — forwarded messages announcing collection " +
      "points travel faster than anything else after an earthquake, and not " +
      "all of them are true.",
    beforeYouGo: {
      heading: "Before you go",
      items: [
        "Confirm the hours with the organization. A collection point opens " +
          "and closes according to the storage space it has.",
        "Bring only what is on the list. What was not asked for takes up " +
          "hands and space needed for what was.",
        "Pack by type and label the boxes. Sorting at the point is the " +
          "bottleneck, not receiving.",
        "Check expiry dates, and send textiles new or clean.",
      ],
    },
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
    learnMore: "Why this fund",
    blockNote:
      "Before contributing, review what we verified, what the campaign claims, " +
      "and what is not public yet.",
    page: {
      heading: "Donate",
      lede: "There are two ways to help. Pick yours.",
      checkedOn: "Reviewed on 11 August 2026",

      moneyChoice: {
        title: "Money",
        body: "To the emergency fund. You can contribute from Colombia or from abroad.",
        readout: "Emergency fund",
      },
      goodsChoice: {
        title: "Goods",
        body: "To a collection point. Each one publishes what it is asking for.",
        readout: (n: number) =>
          n === 1 ? "1 collection point" : `${n} collection points`,
        readoutEmpty: "No confirmed points yet",
      },

      moneyHeading: "Donate money",
      goodsHeading: "Donate goods",

      trustSummary: "Why should you trust this?",
      trustLede:
        "What we checked, what the campaign only asserts, and what is still " +
        "not public. They are kept separate on purpose.",

      actionTitle: "Contribute to the campaign",
      actionBody:
        "The campaign offers three payment routes: a tax-deductible donation " +
        "from the United States, an international donation, and payment in " +
        "pesos using local Colombian methods. All are processed by Stripe.",

      checks: {
        yes: "Verified",
        no: "Not verified",
        verified:
          "Who runs the campaign. Vaki is a Colombian platform with years of " +
          "operation, the campaign lives on its own domain, and payments are " +
          "processed by Stripe.",
        unverified:
          "Where the money lands. The campaign does not yet publish the " +
          "receiving organizations, a disbursement report, or how much of a " +
          "contribution goes to fees.",
      },

      verifiedHeading: "What we verified ourselves",
      verifiedLede:
        "What we checked independently, with the source beside it. We did not " +
        "audit the campaign: we verified who is behind it.",
      verified: [
        {
          title: "Vaki is an established platform, not one created for this emergency",
          detail:
            "It has operated from Colombia for years, has raised more than USD " +
            "$11 million from around 500,000 contributors, and expanded to " +
            "Mexico. Its best-known campaign raised USD $1.1 million from " +
            "23,651 people.",
          source: "Crunchbase, Tracxn, Contxto",
        },
        {
          title: "The campaign lives on Vaki's own domain",
          detail:
            "helpcolombia.vaki.org is a subdomain of vaki.org. It is not a " +
            "lookalike domain registered after the earthquake, which is the " +
            "most common form of post-disaster fraud.",
          source: "Direct domain verification",
        },
        {
          title: "There is a dedicated U.S. entity, with named people behind it",
          detail:
            "Vaki Foundation publishes an address in Miami, Florida, and three " +
            "identified founders: Nicolás Contreras, Raissa Joao, and Ricardo " +
            "Mejía.",
          source: "vaki.org",
        },
        {
          title: "Payments are processed by Stripe",
          detail:
            "No card details are requested in a homemade form: the charge " +
            "happens in Stripe's checkout, a well-known international " +
            "processor.",
          source: "helpcolombia.vaki.org",
        },
      ],

      claimsHeading: "What the campaign says",
      claimsLede:
        "Claims made by the campaign itself. We reproduce them because they " +
        "are relevant, and mark them as theirs because we did not verify them.",
      claims: [
        {
          title: "It describes itself as a U.S. 501(c)(3) nonprofit",
          detail: "On that basis it offers a tax deduction to U.S. donors.",
        },
        {
          title:
            "It says funds go to verified organizations in the affected areas",
          detail:
            "It does not name them or publish the criteria by which it verifies them.",
        },
        {
          title: "It commits to logging and publishing every disbursement",
          detail:
            "That is a forward-looking commitment, not a report you can review today.",
        },
      ],

      gapsHeading: "What is not public yet",
      gapsLede:
        "None of this indicates anything is wrong. These are the details we " +
        "could not yet consult, and the questions worth asking of any " +
        "campaign, including this one.",
      gaps: [
        "The tax identification number (EIN) is not published, so we could not " +
          "confirm the 501(c)(3) status in an independent registry. Vaki " +
          "Foundation itself recommends consulting a tax advisor before " +
          "assuming the deduction.",
        "As of this review there was not yet a published disbursement report " +
          "available to consult.",
        "Neither the recipient organizations nor the percentage of a " +
          "contribution going to platform or processing fees is published.",
      ],

      disclosureHeading: "Declaration of interest",
      disclosureBody:
        "There is a conflict of interest in this recommendation: this site is " +
        "tied to Vaki — the platform running the campaign — by an investment " +
        "stake. It goes here, rather than in a footnote, because it is exactly " +
        "the kind of fact you should know before deciding.",

      otherRegions: {
        heading: "Help another region",
        lede:
          "The earthquake did not stop at Risaralda. If you want your " +
          "contribution to reach another hard-hit area, this is the campaign " +
          "we reviewed.",
        place: "Buenaventura, Valle del Cauca",
        campaignTitle: "Earthquake Relief for Buenaventura, Colombia",
        reviewedOn: "Reviewed on 12 August 2026",
        context:
          "The port was cut off by three landslides on the road to " +
          "Loboguerrero and Buga, with the hospital network at its limit and " +
          "a state of public calamity declared. The mayor said the " +
          "earthquake “exceeded every capacity” the district had.",
        contextSource: "El Tiempo, La Silla Vacía",
        organizerLabel: "Organized by",
        organizer: "Catalina García Cure, from Fort Lauderdale, U.S.",
        verified:
          "The link goes to a real campaign hosted on gofundme.com, with an " +
          "identified person running it and a named receiving organization: " +
          "Patrulla Aérea Civil Colombiana.",
        unverified:
          "It is a personal fundraiser, not an audited entity. Funds arrive " +
          "in a private U.S. account before reaching Colombia, and there is " +
          "no spending report you can review.",
        relation:
          "This link did not arrive through an official channel but through a " +
          "personal connection to the person organizing the campaign. We say " +
          "so for the same reason we declare everything else on this page.",
        cta: "See the campaign",
      },

      alternativesHeading: "This is not the only channel",
      alternativesBody:
        "The Colombian Red Cross and other official channels also accept " +
        "donations for the emergency. We list them alongside this one, with " +
        "the same detail about who operates them.",
      alternativesCta: "See all channels",
    },
  },
  verification: {
    heading: "How we verify",
    cardLink: "How we verify",
    lede:
      "This site sends people places: collection points, donation campaigns, " +
      "registries for finding someone. This is what we check before " +
      "publishing one — and what we do not.",

    meansHeading: "What “verified” means here",
    meansBody:
      "That on the date shown on the card we confirmed three things: the " +
      "place exists, it is run by who we say, and it will receive whoever " +
      "turns up. It does not mean we answer for what happens there, or that " +
      "we have reviewed anyone's books.",

    checksHeading: "What we check before publishing",
    checks: [
      {
        title: "That whoever runs it can be named",
        detail:
          "If we cannot say which organization is behind a place, we have " +
          "not checked it well enough to send you there.",
      },
      {
        title: "That a stranger can actually get in",
        detail:
          "Several of these sit inside clubs, gated compounds and office " +
          "buildings. “We are collecting donations” circulating among their " +
          "members does not mean the public may drive through the gate. We " +
          "ask explicitly.",
      },
      {
        title: "That the address leads to a door, not a building",
        detail:
          "“Viva Cerritos” tells you which building; “the car park” tells " +
          "you where to stop the car. If we only have the building, we " +
          "leave the address empty rather than invent an entrance.",
      },
      {
        title: "That the domain belongs to the organization",
        detail:
          "A lookalike domain registered after the earthquake is the most " +
          "common form of post-disaster fraud. That is why every card " +
          "prints its domain: so you can compare it with the address bar.",
      },
      {
        title: "That money goes through a known processor",
        detail:
          "If a campaign asks for card details in a homemade form rather " +
          "than a recognized gateway, we do not publish it.",
      },
    ],

    limitsHeading: "What we do not check",
    limitsLede:
      "Saying so is part of the method. A verification that does not state " +
      "its limits reads as a guarantee, and it is not one.",
    limits: [
      "We audit no one. We do not see anyone's books or contracts, or where " +
        "each peso goes after you hand it over.",
      "We check who operates a site, not what it publishes. Confirming that " +
        "a page belongs to the Red Cross does not make us responsible for " +
        "what that page says tomorrow.",
      "We do not re-check it on our own. Every card carries the date it was " +
        "reviewed, and a collection point can close within hours. The date " +
        "is part of the fact, not decoration.",
    ],

    badgeHeading: "Why some cards say “Not an official channel”",
    badgeBody:
      "Because whoever runs it is not an authority or the organization " +
      "responsible for that task, but a neighbour, a business or a private " +
      "initiative. It does not mean it is fake — several of this city's " +
      "collection points are exactly that — but it does mean it carries " +
      "none of the obligation to answer that an official channel does.",

    whoHeading: "Who does it",
    whoBody:
      "This site's editors, not a person you have to know. That is why the " +
      "cards say “sismopereira.org” rather than someone's name: a name asks " +
      "you to decide whether you trust a stranger, which is not a question " +
      "you can answer. What does help you decide is the method and the " +
      "date, and both are here.",

    wrongHeading: "If any of this is wrong",
    wrongBody:
      "If a point has closed, changed its hours, or never received anyone, " +
      "tell us. Correcting an old fact matters as much as publishing a new " +
      "one: a collection point that closed this morning sends someone on a " +
      "wasted trip with a full boot.",
    wrongCta: "Send a report",
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
