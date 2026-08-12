-- ---------------------------------------------------------------------------
-- PENDING — three collection points awaiting confirmation
--
-- This is NOT a migration and NOT seed data. Nothing in `supabase/pending/`
-- runs automatically: not on `supabase db reset`, not on deploy. It is a
-- holding file for content that arrived before it could be verified, so the
-- text does not rot in a chat log while somebody makes a phone call.
--
-- Every row below inserts with `verified = false`, which means the goods half
-- of `/donar` will not show them. That is Rule 2 doing its job, not a bug:
--
--   > What counts as confirmation: a named person at the operating
--   > organization, or an official channel of that organization. A screenshot
--   > forwarded through three WhatsApp groups does not count, however
--   > plausible.
--
-- All three arrived as forwarded text. None has been checked against an
-- official channel. Collection points are also where donation fraud lands
-- after a disaster — a fake one is a working method for stealing donated
-- goods — so the gate matters more here than almost anywhere else on the
-- site.
--
-- BEFORE FLIPPING `verified` TO TRUE, for each row:
--   1. Confirm the point exists and is receiving, via an official channel of
--      the operating organization or a named person there.
--   2. Fill in `source_name` (who confirmed it) and `source_url` (the
--      announcement, if one is public). `source_name` is null below on
--      purpose — inventing one would be worse than leaving the gap.
--   3. Set `source` to 'official' if the confirmation came from the
--      organization's own channel. Leave it 'social' otherwise; the card
--      renders a visible "No es un canal oficial" badge for anything else.
--   4. Confirm the opening hours, and the *precise* drop-off spot. Both are
--      noted below where the source did not state them.
--   5. **Confirm a stranger can actually get in.** A point inside a private
--      venue — a club, a gated compound, an office lobby — is only a public
--      drop-off if the operator says non-members may enter. "It exists" and
--      "you may use it" are two different confirmations, and only the second
--      one makes it publishable.
--
-- Then delete this file — a queue nobody drains is worse than no queue.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Comfamiliar Risaralda
--
-- Source text (forwarded, verbatim apart from restored accents): announces a
-- "puesto de recepcion de donaciones" with a needs list, receiving at the
-- Clínica Comfamiliar Risaralda car park.
--
-- GAPS: no opening hours stated. No phone stated. Not confirmed against a
-- Comfamiliar channel.
-- ---------------------------------------------------------------------------
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
values
  ('donation_point',
   'Clínica Comfamiliar Risaralda',
   'Puesto de recepción de donaciones abierto por Comfamiliar Risaralda.',
   'Parqueadero de la Clínica Comfamiliar Risaralda',
   null,  -- hours not stated in the source. Confirm before publishing.
   'operational',
   array[
     'Agua',
     'Productos de aseo personal',
     'Insumos médicos: gasas, catéteres de venoclisis, cánulas, pañales, micropore, cloruro de sodio y alcohol',
     'Toallas y sábanas nuevas',
     'Extensiones eléctricas industriales'
   ],
   'social',
   null,  -- who confirmed it. Fill in before publishing.
   null,
   false);

-- ---------------------------------------------------------------------------
-- 2. Viva Cerritos
--
-- Source text (forwarded, verbatim apart from restored accents): a
-- "KIT DE AYUDA HUMANITARIA / DONACIÓN" list in three groups — aseo personal,
-- primeros auxilios, alimentos — with "Punto de acopio: Viva Cerritos,
-- horario 8 am a 4 pm".
--
-- The three source groups are flattened into one checklist. The grouping was
-- useful to whoever wrote the appeal; a reader standing in a supermarket
-- wants a list they can tick off, and `needs` renders in array order.
--
-- GAPS: "Viva Cerritos" names the site but not the drop-off point within it,
-- so `address` is null rather than guessed — a car park entrance invented
-- here is exactly the Rule 2 failure. No operating organization named: the
-- appeal does not say who is receiving, which is the single most important
-- thing to establish before this row goes live.
-- ---------------------------------------------------------------------------
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
values
  ('donation_point',
   'Viva Cerritos',
   null,
   null,  -- exact drop-off point within the site not stated. Confirm.
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
   'social',
   null,  -- who confirmed it, and who is receiving. Fill in before publishing.
   null,
   false);

-- ---------------------------------------------------------------------------
-- 3. Club Campestre Pereira
--
-- Source text: a letter from the Club's Administración and Junta Directiva to
-- its members, forwarded to us. Most of it is not ours to publish and is not
-- included below:
--
--   * The opening offer of support is addressed to members and their families
--     ("cuentan con nosotros… no dude en contactarnos"). Republishing that to
--     the general public misrepresents who was offered what, and would point
--     strangers at a members' line. Dropped.
--   * The closing thanks to "nuestra comunidad" is club-internal warmth with
--     no operational content. Dropped.
--
-- What survives is the part addressed to anyone with something to give: the
-- needs list, and the reason it is shaped the way it is.
--
-- The letter leads with a genuinely useful negative signal — several centres
-- already have enough food, so the Club is concentrating on what is short.
-- That is the single most valuable sentence in any collection-point appeal,
-- and it is preserved in `description` **attributed to the Club**. We do not
-- restate it as our own finding: it is a claim about other people's
-- warehouses that we have not checked (Rule 3), and "no lleven alimentos" is
-- not something this site should assert on a forwarded letter.
--
-- GAPS: no hours stated. "Club Campestre Pereira" names the venue but not the
-- drop-off point, so `address` is null rather than guessed.
--
-- AND ONE THIS LIST HAS NOT NEEDED BEFORE: **this is a private members'
-- club.** Whether a non-member can drive through the gate with a bag of
-- nappies is not stated anywhere in the letter, and if the answer is no, then
-- publishing it as a public drop-off point sends people to a barrier — the
-- Rule 2 failure with a security guard attached. Confirm access explicitly,
-- not just existence.
-- ---------------------------------------------------------------------------
insert into resources
  (kind, name, description, address, hours, status, needs,
   source, source_name, source_url, verified)
values
  ('donation_point',
   'Club Campestre Pereira',
   'Centro de acopio para familias, niños y adultos mayores. El Club informa '
   'que varios centros ya cuentan con alimentos suficientes, y que por ahora '
   'concentra su recolección en los elementos de esta lista.',
   null,  -- drop-off point within the club not stated. Confirm.
   null,  -- hours not stated in the source. Confirm before publishing.
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
   'social',
   null,  -- confirm with the Club, and record who confirmed it.
   null,
   false);

-- ---------------------------------------------------------------------------
-- Publishing, once confirmed. Verify by selecting the row back, not by the
-- insert's return code — the same discipline the status board needs.
-- ---------------------------------------------------------------------------
-- update resources
--    set verified    = true,
--        source      = 'official',
--        source_name = '<official channel or named contact>',
--        source_url  = '<link to the announcement, if public>',
--        address     = '<precise drop-off point>',
--        hours       = '<confirmed hours>'
--  where kind = 'donation_point' and name = '<name>';
--
-- select name, address, hours, verified, source, source_name
--   from resources where kind = 'donation_point';
