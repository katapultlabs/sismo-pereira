-- ---------------------------------------------------------------------------
-- RUN THIS AGAINST PRODUCTION — three collection points, cleared to publish
--
-- Paste the whole file into the Supabase SQL editor for project
-- `quwzajtjnvgwkhqnszsb` and run it once. It does two things:
--
--   1. Adds the `needs` / `source` / `source_name` / `source_url` columns to
--      `resources`. This is migration `20260811150000_collection_points.sql`;
--      the CLI cannot reach this project from here, so the DDL is repeated
--      inline with `if not exists` guards rather than pushed.
--   2. Publishes the three points below with `verified = true`.
--
-- **It is safe to run twice.** The DDL is `if not exists`; each insert is
-- guarded on the point's name, so a second run inserts nothing rather than
-- duplicating a card.
--
-- Provenance, stated plainly because the cards state it too: all three
-- arrived as forwarded text, and the site operator confirmed them directly
-- rather than waiting on each organization's own channel. That is why
-- `source` is 'community' and not 'official' — the badge on each card will
-- read "No es un canal oficial", which is the accurate claim: sismopereira.org
-- vouches for these, the operating organizations have not announced them to
-- us. Change a row to 'official' only when that org's own channel confirms it.
--
-- Still missing, and worth filling in as it is learned (`update`, don't
-- re-insert): opening hours for Comfamiliar and Club Campestre, and the
-- precise drop-off spot inside Viva Cerritos and Club Campestre. Every one of
-- those is null rather than guessed — Rule 8.
-- ---------------------------------------------------------------------------

begin;

-- 1 -------------------------------------------------------------------------
-- Schema. Matches supabase/migrations/20260811150000_collection_points.sql.
-- No `revoke` needed: `resources` already grants table-wide SELECT to anon and
-- authenticated, and rows are gated by the `resources_public_read` policy on
-- `verified`. Every column here is public by design and none of it is PII.
-- ---------------------------------------------------------------------------
alter table resources
  add column if not exists needs       text[]      not null default '{}',
  add column if not exists source      source_kind not null default 'community',
  add column if not exists source_name text,
  add column if not exists source_url  text;

create index if not exists resources_donation_idx
  on resources (name)
  where verified and kind = 'donation_point';

-- 2 -------------------------------------------------------------------------
-- The three points.
-- ---------------------------------------------------------------------------

-- Comfamiliar Risaralda — receiving at the clinic car park.
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
select
  'donation_point',
  'Clínica Comfamiliar Risaralda',
  'Puesto de recepción de donaciones abierto por Comfamiliar Risaralda.',
  'Parqueadero de la Clínica Comfamiliar Risaralda',
  null,
  'operational',
  array[
    'Agua',
    'Productos de aseo personal',
    'Insumos médicos: gasas, catéteres de venoclisis, cánulas, pañales, micropore, cloruro de sodio y alcohol',
    'Toallas y sábanas nuevas',
    'Extensiones eléctricas industriales'
  ],
  'community',
  'Tomás Gutiérrez — sismopereira.org',
  null,
  true
where not exists (
  select 1 from resources
  where kind = 'donation_point' and name = 'Clínica Comfamiliar Risaralda'
);

-- Viva Cerritos — hours known, exact drop-off point inside the site is not.
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
select
  'donation_point',
  'Viva Cerritos',
  null,
  null,
  '8:00 a. m. – 4:00 p. m.',
  'operational',
  array[
    'Toallas para el cuerpo',
    'Toallas higiénicas',
    'Elementos de aseo: cepillos de dientes, crema dental, jabones, shampoo, crema de manos',
    'Agua embotellada, individual o por litros',
    'Gel antibacterial',
    'Botiquines de primeros auxilios: gasa, agua oxigenada, curas, tijeras, micropore, alcohol',
    'Tapabocas N95',
    'Guantes de nitrilo, de silicona o de carnaza',
    'Alimentos no perecederos',
    'Almuerzos o cenas preparados'
  ],
  'community',
  'Tomás Gutiérrez — sismopereira.org',
  null,
  true
where not exists (
  select 1 from resources
  where kind = 'donation_point' and name = 'Viva Cerritos'
);

-- Club Campestre Pereira.
--
-- Published from a letter to the club's members. The members-only half of it
-- (the offer of support, the closing thanks) is deliberately not here — see
-- the commit that staged this. The "several centres already have enough food"
-- line survives in `description` attributed to the Club, because it is the
-- most useful sentence in the appeal and it is *their* claim about other
-- people's warehouses, not our finding.
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
select
  'donation_point',
  'Club Campestre Pereira',
  'Centro de acopio para familias, niños y adultos mayores. El Club informa '
  'que varios centros ya cuentan con alimentos suficientes, y que por ahora '
  'concentra su recolección en los elementos de esta lista.',
  null,
  null,
  'operational',
  array[
    'Pañales para bebé, etapas 0 a 6',
    'Pañales para adulto, especialmente talla L',
    'Pañitos húmedos',
    'Ropa para niños, de recién nacido a 14 años',
    'Ropa para adultos',
    'Zapatos para niños y adultos',
    'Cobijas y colchonetas',
    'Jabón líquido o gel de ducha',
    'Repelente'
  ],
  'community',
  'Tomás Gutiérrez — sismopereira.org',
  null,
  true
where not exists (
  select 1 from resources
  where kind = 'donation_point' and name = 'Club Campestre Pereira'
);

commit;

-- 3 -------------------------------------------------------------------------
-- Confirm. Check the rows, not the insert's return code.
-- ---------------------------------------------------------------------------
select name, coalesce(address, '—') as address, coalesce(hours, '—') as hours,
       array_length(needs, 1) as needs, source, verified
from resources
where kind = 'donation_point'
order by name;

-- Taking one down when it stops receiving — it vanishes on the next request:
--   update resources set verified = false
--    where kind = 'donation_point' and name = '<name>';
