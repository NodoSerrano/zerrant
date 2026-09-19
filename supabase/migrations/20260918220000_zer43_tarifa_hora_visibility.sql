-- ZER-43: mask tarifa_hora by visibilidad_tarifa at the PostgREST boundary.
--
-- Threat: any authenticated JWT could GET /rest/v1/profiles?select=tarifa_hora
-- and read private rates. RLS is row-level only; UI masking is not enough.
--
-- Approach:
-- 1) Revoke table-level SELECT on profiles for anon/authenticated, re-grant
--    every column except tarifa_hora (column privileges are not row-conditional).
-- 2) Expose public.profiles_with_rate: security definer (so the CASE can read
--    tarifa_hora) + security_barrier + WHERE matching existing read policies
--    (own row / admin / non-tourist target). security_invoker would fail once
--    tarifa_hora SELECT is revoked from the caller.
-- 3) App rate reads go through the view; other profile reads keep using the
--    base table without tarifa_hora (and must not use select *).

create or replace function public.is_non_tourist()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and tier <> 'tourist'
  );
$$;

revoke execute on function public.is_non_tourist() from public;
grant execute on function public.is_non_tourist() to authenticated, service_role;

drop view if exists public.profiles_with_rate;

create view public.profiles_with_rate
with (security_barrier = true)
as
select
  p.id,
  p.email,
  p.nombre,
  p.apellido,
  p.apodo,
  p.nombre_visible,
  p.avatar_url,
  p.tier,
  p.is_platform_admin,
  p.fecha_nacimiento,
  p.bio,
  p.contacto_telegram,
  p.sitio_url,
  p.disponibilidad,
  p.visibilidad_tarifa,
  p.aprobado_en,
  p.created_at,
  p.onboarding_completado_en,
  case
    when auth.uid() = p.id then p.tarifa_hora
    when public.is_platform_admin() then p.tarifa_hora
    when p.visibilidad_tarifa = 'publica' and public.is_non_tourist() then p.tarifa_hora
    else null
  end as tarifa_hora
from public.profiles p
where
  auth.uid() = p.id
  or public.is_platform_admin()
  or p.tier <> 'tourist';

comment on view public.profiles_with_rate is
  'ZER-43 masked profile read surface; tarifa_hora null unless self/admin/publica+non-tourist viewer.';

revoke all on public.profiles_with_rate from public;
grant select on public.profiles_with_rate to authenticated, service_role;

revoke select on public.profiles from anon, authenticated;

grant select (
  id,
  email,
  nombre,
  apellido,
  apodo,
  nombre_visible,
  avatar_url,
  tier,
  is_platform_admin,
  fecha_nacimiento,
  bio,
  contacto_telegram,
  sitio_url,
  disponibilidad,
  visibilidad_tarifa,
  aprobado_en,
  created_at,
  onboarding_completado_en
) on public.profiles to authenticated;
