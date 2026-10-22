-- ZER-166 follow-up — optional loan date range on aportes (por un tiempo).
-- Both columns optional; when both set, desde <= hasta.

alter table public.aportes
  add column if not exists prestamo_desde date,
  add column if not exists prestamo_hasta date;

alter table public.aportes
  drop constraint if exists aportes_prestamo_rango_ok;

alter table public.aportes
  add constraint aportes_prestamo_rango_ok
  check (
    prestamo_desde is null
    or prestamo_hasta is null
    or prestamo_desde <= prestamo_hasta
  );

comment on column public.aportes.prestamo_desde is
  'Optional loan start (Donaciones del Nodo, tipo prestamo).';
comment on column public.aportes.prestamo_hasta is
  'Optional loan end (Donaciones del Nodo, tipo prestamo).';

revoke insert on public.aportes from authenticated;
revoke update on public.aportes from authenticated;

grant insert (
  profile_id,
  tipo,
  descripcion,
  monto,
  fecha,
  registrado_por,
  titulo,
  estado,
  imagen_path,
  prestamo_desde,
  prestamo_hasta
) on public.aportes to authenticated;

grant update (
  tipo,
  descripcion,
  monto,
  fecha,
  titulo,
  imagen_path,
  prestamo_desde,
  prestamo_hasta
) on public.aportes to authenticated;
