-- ZER-108: membership screening snapshot on membership_requests (Google Form → /solicitar).
-- profiles stays lean; tourists insert screening columns only (tier_solicitado still not grantable).

create type public.membership_frecuencia_uso as enum (
  '1_2_mes',
  '1_semana',
  '2_3_semana',
  '4_5_semana',
  'casi_diario',
  'no_se'
);

create type public.membership_duracion_visita as enum (
  'menos_2h',
  '2_4h',
  '4_6h',
  'mas_6h',
  'depende'
);

create type public.membership_aporte_actitud as enum (
  'comodo',
  'esfuerzo',
  'preferiria_menos',
  'podria_mas',
  'conversar_particular',
  'no_seguro'
);

create type public.membership_situacion_actual as enum (
  'estudio',
  'trabajo',
  'estudio_trabajo',
  'ninguno',
  'otra'
);

create type public.membership_aporte_mayor as enum (
  'si',
  'probablemente',
  'no',
  'conversarlo'
);

alter table public.membership_requests
  add column contacto_whatsapp text,
  add column frecuencia_uso public.membership_frecuencia_uso,
  add column duracion_visita public.membership_duracion_visita,
  add column aporte_actitud public.membership_aporte_actitud,
  add column reunion_disponibilidad text,
  add column situacion_actual public.membership_situacion_actual,
  add column ocupacion_detalle text,
  add column entrevista_items text,
  add column aporte_otro text,
  add column aporte_mayor public.membership_aporte_mayor;

-- Existing rows (pre-ZER-108) keep nulls. New app inserts require core via the action.
-- PostgREST column INSERT grant: extend beyond profile_id + mensaje.
grant insert (
  profile_id,
  mensaje,
  contacto_whatsapp,
  frecuencia_uso,
  duracion_visita,
  aporte_actitud,
  reunion_disponibilidad,
  situacion_actual,
  ocupacion_detalle,
  entrevista_items,
  aporte_otro,
  aporte_mayor
) on public.membership_requests to authenticated;
