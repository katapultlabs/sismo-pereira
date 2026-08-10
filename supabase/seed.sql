-- =============================================================================
-- Seed data for Sismo Pereira
--
-- IMPORTANT EDITORIAL RULE
-- Reference data below (zones, organization names) is real. Operational data
-- (service status) is deliberately seeded as 'unknown' rather than invented.
-- On a crisis information site a plausible-but-fabricated outage is worse than
-- no data at all: people make evacuation and travel decisions on it. Status
-- rows flip to real values only when an official source or a verified partner
-- publishes them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Zones — Pereira's 19 comunas and its corregimientos
-- ---------------------------------------------------------------------------
insert into zones (slug, name, kind, parent_slug) values
  ('centro',            'Centro',              'comuna', 'pereira'),
  ('villa-santana',     'Villa Santana',       'comuna', 'pereira'),
  ('rio-otun',          'Río Otún',            'comuna', 'pereira'),
  ('san-joaquin',       'San Joaquín',         'comuna', 'pereira'),
  ('cuba',              'Cuba',                'comuna', 'pereira'),
  ('el-oso',            'El Oso',              'comuna', 'pereira'),
  ('perla-del-otun',    'Perla del Otún',      'comuna', 'pereira'),
  ('consota',           'Consotá',             'comuna', 'pereira'),
  ('el-rocio',          'El Rocío',            'comuna', 'pereira'),
  ('el-poblado',        'El Poblado',          'comuna', 'pereira'),
  ('san-nicolas',       'San Nicolás',         'comuna', 'pereira'),
  ('olimpica',          'Olímpica',            'comuna', 'pereira'),
  ('ferrocarril',       'Ferrocarril',         'comuna', 'pereira'),
  ('universidad',       'Universidad',         'comuna', 'pereira'),
  ('boston',            'Boston',              'comuna', 'pereira'),
  ('jardin',            'Jardín',              'comuna', 'pereira'),
  ('villavicencio',     'Villavicencio',       'comuna', 'pereira'),
  ('oriente',           'Oriente',             'comuna', 'pereira'),
  ('del-cafe',          'Del Café',            'comuna', 'pereira'),
  ('altagracia',        'Altagracia',          'corregimiento', 'pereira'),
  ('arabia',            'Arabia',              'corregimiento', 'pereira'),
  ('caimalito',         'Caimalito',           'corregimiento', 'pereira'),
  ('cerritos',          'Cerritos',            'corregimiento', 'pereira'),
  ('combia-alta',       'Combia Alta',         'corregimiento', 'pereira'),
  ('combia-baja',       'Combia Baja',         'corregimiento', 'pereira'),
  ('la-bella',          'La Bella',            'corregimiento', 'pereira'),
  ('la-estrella',       'La Estrella - La Palmilla', 'corregimiento', 'pereira'),
  ('morelia',           'Morelia',             'corregimiento', 'pereira'),
  ('puerto-caldas',     'Puerto Caldas',       'corregimiento', 'pereira'),
  ('tribunas-corcega',  'Tribunas Córcega',    'corregimiento', 'pereira'),
  ('pereira',           'Pereira (todo el municipio)', 'municipio', null),
  ('dosquebradas',      'Dosquebradas',        'municipio', null),
  ('la-virginia',       'La Virginia',         'municipio', null),
  ('santa-rosa',        'Santa Rosa de Cabal', 'municipio', null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Organizations
-- Names are real. Contact details are intentionally left NULL — they must be
-- entered by the organization itself or confirmed against an official source,
-- never guessed. `verified` stays false until a human confirms the account.
-- ---------------------------------------------------------------------------
insert into organizations (slug, name, short_name, type, services, verified) values
  ('energia-pereira', 'Empresa de Energía de Pereira', 'EEP',
   'utility', '{electricity}', false),
  ('aguas-y-aguas', 'Aguas y Aguas de Pereira', 'Aguas y Aguas',
   'utility', '{water}', false),
  ('efigas', 'Efigas', 'Efigas',
   'utility', '{gas}', false),
  ('claro', 'Claro Colombia', 'Claro',
   'telco', '{mobile,internet}', false),
  ('movistar', 'Movistar Colombia', 'Movistar',
   'telco', '{mobile,internet}', false),
  ('tigo', 'Tigo Colombia', 'Tigo',
   'telco', '{mobile,internet}', false),
  ('wom', 'WOM Colombia', 'WOM',
   'telco', '{mobile,internet}', false),
  ('alcaldia-pereira', 'Alcaldía de Pereira', 'Alcaldía',
   'government', '{}', false),
  ('gobernacion-risaralda', 'Gobernación de Risaralda', 'Gobernación',
   'government', '{}', false),
  ('ungrd', 'Unidad Nacional para la Gestión del Riesgo de Desastres', 'UNGRD',
   'government', '{}', false),
  ('sgc', 'Servicio Geológico Colombiano', 'SGC',
   'government', '{}', false),
  ('cruz-roja-risaralda', 'Cruz Roja Colombiana — Seccional Risaralda', 'Cruz Roja',
   'ngo', '{health}', false),
  ('defensa-civil', 'Defensa Civil Colombiana', 'Defensa Civil',
   'ngo', '{}', false),
  ('bomberos-pereira', 'Bomberos de Pereira', 'Bomberos',
   'government', '{}', false),
  ('megabus', 'Megabús', 'Megabús',
   'utility', '{transport}', false),
  ('aeropuerto-matecana', 'Aeropuerto Internacional Matecaña', 'Matecaña',
   'utility', '{transport}', false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Baseline service status: explicitly UNKNOWN, municipality-wide.
-- This is the honest starting state — it renders as "sin confirmar" in the UI
-- and invites partners to fill it in, rather than implying knowledge we lack.
-- ---------------------------------------------------------------------------
insert into service_status (service, zone_slug, status, headline, detail, source)
select
  s.service,
  'pereira',
  'unknown',
  'Sin confirmación oficial',
  'Aún no hemos recibido un reporte verificado del operador para este servicio. '
  || 'Si representas a la empresa responsable, puedes publicar aquí.',
  'official'
from unnest(array[
  'electricity', 'water', 'gas', 'internet', 'mobile', 'transport'
]::service_type[]) as s(service);

-- ---------------------------------------------------------------------------
-- Health is the one service that is NOT unknown. The mayor named the state of
-- the city's emergency rooms on the record from the PMU at 11:47 a. m., so
-- leaving this card on "sin confirmación oficial" would understate what we
-- know about the most life-critical service on the board.
-- Mirrors the `health` entry in src/lib/fallback-data.ts — keep both in sync.
-- ---------------------------------------------------------------------------
insert into service_status
  (service, zone_slug, status, headline, detail, source, org_id, reported_at)
select
  'health', 'pereira', 'outage',
  'Urgencias saturadas: cuatro centros médicos no reciben pacientes',
  'Según el reporte del alcalde desde el PMU, la Clínica Los Nevados, el '
  || 'Hospital Universitario San Jorge y la Clínica Comfamiliar colapsaron por '
  || 'demanda de servicios y no están atendiendo. La Clínica Noé fue desalojada '
  || 'por daños en su infraestructura. No te dirijas a estos centros. Si '
  || 'necesitas atención médica urgente, llama al 123.',
  'official',
  o.id,
  '2026-08-10T16:47:00Z'
from organizations o
where o.slug = 'alcaldia-pereira';

-- ---------------------------------------------------------------------------
-- Opening updates — sourced from public reporting on 2026-08-10.
-- Each carries its source so readers can judge it for themselves.
-- ---------------------------------------------------------------------------
insert into updates
  (slug, title, summary, body, severity, services, zone_slugs,
   source, source_name, source_url, status, pinned, published_at)
values
  (
    'centros-medicos-no-reciben-pacientes',
    'Cuatro centros médicos de Pereira no están recibiendo pacientes',
    'Los Nevados, San Jorge y Comfamiliar colapsaron por demanda de servicios. La '
    || 'Clínica Noé fue desalojada por daños estructurales.',
    E'En su reporte desde el Puesto de Mando Unificado (PMU), el alcalde de Pereira '
    || E'informó que los siguientes centros médicos **no están atendiendo**:\n\n'
    -- Bullet characters, not Markdown "- ": update bodies render through
    -- `renderEmphasis`, which supports **bold** only.
    || E'• **Clínica Los Nevados** — colapsada por demanda de servicios. El alcalde '
    || E'pidió expresamente no dirigirse allí.\n'
    || E'• **Hospital Universitario San Jorge** — colapsado por demanda de servicios; '
    || E'no está atendiendo a los heridos que han llegado.\n'
    || E'• **Clínica Comfamiliar** — colapsada por demanda de servicios.\n'
    || E'• **Clínica Noé** — desalojada porque su infraestructura resultó averiada y '
    || E'presentaba condiciones de riesgo.\n\n'
    || E'**Si necesitas atención médica urgente, llama al 123** antes de desplazarte. '
    || E'Las vías deben permanecer libres para los organismos de socorro.\n\n'
    || E'El alcalde no anunció centros médicos alternativos ni puntos de atención '
    || E'habilitados en este corte. **No publicamos un destino alterno porque todavía '
    || E'no tenemos uno confirmado por una fuente oficial**, y enviar a alguien herido '
    || E'a un lugar equivocado es peor que no dar información.\n\n'
    || E'Este es un corte puntual de las 11:47 a. m. y puede quedar desactualizado con '
    || E'nuevos reportes oficiales.',
    'critical', '{health}', '{pereira}',
    'official', 'Alcaldía de Pereira — Puesto de Mando Unificado (PMU)',
    null,
    'published', true, '2026-08-10T16:47:00Z'
  ),
  (
    'sismo-magnitud-7-4-10-agosto-2026',
    'Sismo de magnitud 7.4 con epicentro en Chocó sacude el Eje Cafetero',
    'El movimiento se registró a las 7:34 a. m. del 10 de agosto de 2026. Pereira '
    || 'es una de las ciudades más afectadas.',
    E'El Servicio Geológico Colombiano reportó un sismo de magnitud 7.4 con epicentro '
    || E'en el departamento del Chocó, aproximadamente 55 km al occidente de Pereira y a '
    || E'unos 107 km de profundidad.\n\nEl sismo se sintió en Bogotá, Medellín, Cali y '
    || E'Manizales, y también en Ecuador y Panamá.\n\nEsta página se actualiza a medida '
    || E'que confirmamos información con fuentes oficiales.',
    'critical', '{}', '{pereira}',
    'media', 'Servicio Geológico Colombiano / CNN en Español',
    'https://cnnespanol.cnn.com/2026/08/10/colombia/terremoto-sismo-san-jose-choco-orix',
    'published', true, '2026-08-10T12:50:00Z'
  ),
  (
    'afectaciones-estructurales-pereira',
    'Reportan daños estructurales en varios edificios de Pereira',
    'Medios nacionales reportan colapsos parciales y daños en edificaciones. El '
    || 'aeropuerto Matecaña resultó afectado.',
    E'Se reportan daños graves en varias edificaciones de Pereira. La cubierta de la '
    || E'terminal aérea del Aeropuerto Internacional Matecaña resultó afectada.\n\n'
    || E'**No ingreses a edificaciones con daño visible** hasta que sean evaluadas por '
    || E'personal técnico. Reporta estructuras en riesgo a través de esta página o a la '
    || E'línea de emergencias 123.',
    'critical', '{transport}', '{pereira,centro}',
    'media', 'El Tiempo',
    'https://www.eltiempo.com/colombia/otras-ciudades/temblor-en-colombia-deja-graves-afectaciones-en-manizales-catedral-y-varios-edificios-afectados-escombros-y-heridos-3577256',
    'published', true, '2026-08-10T13:10:00Z'
  ),
  (
    'fallas-energia-telefonia',
    'Fallas de energía y telefonía en Pereira, Manizales y Cali',
    'Las empresas del sector eléctrico revisan redes de distribución. No se '
    || 'reportan daños en plantas de generación térmica.',
    E'El sector eléctrico colombiano reportó afectaciones en la distribución del '
    || E'servicio tras el sismo, sin daños en plantas de generación térmica. Las empresas '
    || E'revisan las redes de distribución en Manizales, Pereira y Cali para identificar '
    || E'daños y restablecer el servicio.\n\nTambién se reportan intermitencias en '
    || E'servicios de telefonía y comunicaciones.\n\n**Usa mensajes de texto o datos en '
    || E'lugar de llamadas** para liberar capacidad de la red.',
    'warning', '{electricity,mobile,internet}', '{pereira}',
    'media', 'Yahoo Noticias',
    'https://es-us.noticias.yahoo.com/manizales-pereira-cali-reportan-fallas-151409974.html',
    'published', false, '2026-08-10T13:25:00Z'
  )
on conflict (slug) do nothing;
