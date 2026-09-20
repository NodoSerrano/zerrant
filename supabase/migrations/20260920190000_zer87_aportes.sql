-- ZER-87 / Story 6.1 — M6 foundation: aportes + aporte_tipo + RLS + grants.
--
-- PRD §6: profile_id, tipo (9 valores sin acento), descripcion, monto nullable,
-- fecha, registrado_por, created_at. Sin columna puntos (Backlog Puntos Serrano).
--
-- RLS (docs/roadmap/Seguridad RLS.md):
--   SELECT: serranos (tier <> tourist) o platform admin
--   INSERT: serrano dueño (profile_id = auth.uid) o admin; registrado_por = auth.uid
--   UPDATE/DELETE: registrante o platform admin; profile_id/registrado_por inmutables
--
-- "Económicos → Tesorería" es convención organizacional (profile_roles), no policy.
-- Admin platform cubre carga económica ajena.
--
-- Grants: column-level DML; no UPDATE de profile_id / registrado_por.
-- ZER-49 default privileges cover new tables; explicit grants remain defensive.

-- --- 1. Enum ---

create type public.aporte_tipo as enum (
  'economico',
  'donacion',
  'prestamo',
  'charla',
  'actividad',
  'mantenimiento',
  'administracion',
  'yerba',
  'otro'
);

-- --- 2. Table ---

create table public.aportes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tipo public.aporte_tipo not null,
  descripcion text,
  monto numeric,
  fecha date not null,
  registrado_por uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint aportes_monto_nonnegative check (monto is null or monto >= 0)
);

create index idx_aportes_profile_id on public.aportes(profile_id);
create index idx_aportes_fecha on public.aportes(fecha desc);
create index idx_aportes_registrado_por on public.aportes(registrado_por);
create index idx_aportes_tipo on public.aportes(tipo);

-- --- 3. RLS ---

alter table public.aportes enable row level security;

create policy "Serranos can read aportes"
  on public.aportes
  for select
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
  );

create policy "Owner or admin can insert aportes"
  on public.aportes
  for insert
  with check (
    auth.uid() = registrado_por
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
    and (
      auth.uid() = profile_id
      or public.is_platform_admin()
    )
  );

-- Registrante or platform admin may update content; FKs stay immutable
-- (grant omits profile_id/registrado_por; with check also pins existing values).
create policy "Registrante or admin can update aportes"
  on public.aportes
  for update
  using (
    auth.uid() = registrado_por
    or public.is_platform_admin()
  )
  with check (
    profile_id = (select a.profile_id from public.aportes a where a.id = aportes.id)
    and registrado_por = (select a.registrado_por from public.aportes a where a.id = aportes.id)
    and (
      auth.uid() = registrado_por
      or public.is_platform_admin()
    )
  );

create policy "Registrante or admin can delete aportes"
  on public.aportes
  for delete
  using (
    auth.uid() = registrado_por
    or public.is_platform_admin()
  );

-- --- 4. Grants (PostgREST) ---

grant select on public.aportes to authenticated;

grant insert (profile_id, tipo, descripcion, monto, fecha, registrado_por)
  on public.aportes to authenticated;

grant update (tipo, descripcion, monto, fecha)
  on public.aportes to authenticated;

grant delete on public.aportes to authenticated;
