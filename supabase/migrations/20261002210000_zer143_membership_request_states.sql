-- ZER-143: membership request & interview state machine.
--
-- Contract for ZER-144 (reprogramar), ZER-167 (admin pipeline) and ZER-169
-- (historial). Mirrors src/features/membership/request-state.ts; a DB test
-- (supabase/tests/membership-request-states.db.test.ts) asserts parity.
--
--   pendiente_coordinacion → entrevista_solicitada | cerrada
--   entrevista_solicitada  → entrevista_coordinada | reprogramacion | cerrada
--   entrevista_coordinada  → reprogramacion | entrevista_realizada | cerrada
--   reprogramacion         → entrevista_solicitada | entrevista_coordinada | cerrada
--   entrevista_realizada   → aprobado | cerrada
--   aprobado, cerrada      → (terminal)
--
-- Trust boundary: service_role (server-side only, never shipped to clients) is
-- trusted. It bypasses RLS and the RPC's actor check by design, but the BEFORE
-- trigger still rejects any estado pair not in membership_request_transitions,
-- and the AFTER trigger still logs it (actor_id null). App code must transition
-- through transition_membership_request(), which authorizes per edge actor.
--
-- Enforcement layers:
--   1. BEFORE trigger on membership_requests rejects any (old, new) estado pair
--      not in membership_request_transitions — applies to every role, including
--      service_role and future RPCs.
--   2. transition_membership_request() is the only write path for apps: it
--      authorizes the caller against the edge's actor (admin/owner).
--   3. AFTER trigger appends one membership_request_events row per change.
--   4. Grants: no INSERT/UPDATE/DELETE on membership_requests beyond the
--      applicant's screening columns; history and transitions are read-only.
--
-- Data migration (lossless): pendiente → pendiente_coordinacion,
-- aprobada → aprobado, rechazada → cerrada. Existing rows get backfilled
-- history (creation row + one row for their current state when not initial).
--
-- REVERSE (manual, run as postgres in one transaction):
--   drop function public.transition_membership_request(uuid, public.membership_request_estado, text);
--   drop trigger membership_requests_estado_guard on public.membership_requests;
--   drop trigger membership_requests_estado_log_insert on public.membership_requests;
--   drop trigger membership_requests_estado_log_update on public.membership_requests;
--   drop function public.membership_requests_guard_estado();
--   drop function public.membership_requests_log_estado();
--   drop table public.membership_request_events;
--   drop table public.membership_request_transitions;
--   drop index public.membership_requests_one_active_per_profile;
--   alter type public.membership_request_estado rename to membership_request_estado_zer143;
--   create type public.membership_request_estado as enum ('pendiente', 'aprobada', 'rechazada');
--   alter table public.membership_requests alter column estado drop default;
--   alter table public.membership_requests alter column estado type public.membership_request_estado
--     using (case estado::text when 'aprobado' then 'aprobada' when 'cerrada' then 'rechazada'
--            else 'pendiente' end)::public.membership_request_estado;
--   alter table public.membership_requests alter column estado set default 'pendiente';
--   drop type public.membership_request_estado_zer143;
--   create unique index membership_requests_one_pending_per_profile
--     on public.membership_requests (profile_id) where estado = 'pendiente';
--   create policy "Only admins can update membership requests"
--     on public.membership_requests for update
--     using (exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true))
--     with check (exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true));
--   grant select, insert, update, delete on public.membership_requests to anon, authenticated;
--   (restores the table-level DML that 20260821222554_grants_dml_public.sql had granted;
--   the column-level INSERT grant from 20260922020000_zer108_membership_screening.sql
--   is then subsumed, exactly as before this migration)
--   then re-create approve_membership_request(uuid) verbatim from
--   20260807140000_approve_membership_rpc.sql and reject_membership_request(uuid)
--   verbatim from section 1 of 20260807150000_admin_membership_security.sql,
--   including their revoke/grant execute statements.
--   Interview states collapse to 'pendiente' (the only lossy step).

-- --- 1. Drop objects bound to the legacy enum ---

drop function if exists public.approve_membership_request(uuid);
drop function if exists public.reject_membership_request(uuid);
drop index if exists public.membership_requests_one_pending_per_profile;
drop index if exists public.idx_membership_requests_estado;

-- The RPC becomes the only write path; an UPDATE policy would only invite
-- direct writes that skip authorization by actor.
drop policy if exists "Only admins can update membership requests" on public.membership_requests;

-- --- 2. Replace the enum (same name, so generated types keep their key) ---

alter type public.membership_request_estado rename to membership_request_estado_legacy;

create type public.membership_request_estado as enum (
  'pendiente_coordinacion',
  'entrevista_solicitada',
  'entrevista_coordinada',
  'reprogramacion',
  'entrevista_realizada',
  'aprobado',
  'cerrada'
);

alter table public.membership_requests alter column estado drop default;

alter table public.membership_requests
  alter column estado type public.membership_request_estado
  using (
    case estado::text
      when 'pendiente' then 'pendiente_coordinacion'
      when 'aprobada' then 'aprobado'
      when 'rechazada' then 'cerrada'
    end
  )::public.membership_request_estado;

alter table public.membership_requests
  alter column estado set default 'pendiente_coordinacion';

drop type public.membership_request_estado_legacy;

create index idx_membership_requests_estado on public.membership_requests (estado);

-- One open request per profile (replaces one-pending). Closed or approved
-- requests stay as history and do not block a new one.
create unique index membership_requests_one_active_per_profile
  on public.membership_requests (profile_id)
  where estado not in ('aprobado', 'cerrada');

-- --- 3. Transitions table (source of truth inside the DB) ---

create table public.membership_request_transitions (
  from_estado public.membership_request_estado not null,
  to_estado public.membership_request_estado not null,
  actor text not null check (actor in ('admin', 'owner')),
  primary key (from_estado, to_estado, actor),
  check (from_estado <> to_estado)
);

insert into public.membership_request_transitions (from_estado, to_estado, actor) values
  ('pendiente_coordinacion', 'entrevista_solicitada', 'admin'),
  ('pendiente_coordinacion', 'cerrada', 'admin'),
  ('entrevista_solicitada', 'entrevista_coordinada', 'admin'),
  ('entrevista_solicitada', 'reprogramacion', 'admin'),
  ('entrevista_solicitada', 'cerrada', 'admin'),
  ('entrevista_coordinada', 'reprogramacion', 'admin'),
  ('entrevista_coordinada', 'entrevista_realizada', 'admin'),
  ('entrevista_coordinada', 'cerrada', 'admin'),
  ('reprogramacion', 'entrevista_solicitada', 'admin'),
  ('reprogramacion', 'entrevista_coordinada', 'admin'),
  ('reprogramacion', 'cerrada', 'admin'),
  ('entrevista_realizada', 'aprobado', 'admin'),
  ('entrevista_realizada', 'cerrada', 'admin');

alter table public.membership_request_transitions enable row level security;

create policy "Authenticated can read membership request transitions"
  on public.membership_request_transitions
  for select
  to authenticated
  using (true);

-- --- 4. History table (append-only) ---

create table public.membership_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.membership_requests (id) on delete cascade,
  from_estado public.membership_request_estado,
  to_estado public.membership_request_estado not null,
  actor_id uuid references public.profiles (id) on delete set null,
  motivo text check (motivo is null or char_length(motivo) <= 500),
  created_at timestamptz not null default now()
);

create index idx_membership_request_events_request
  on public.membership_request_events (request_id, created_at);

alter table public.membership_request_events enable row level security;

-- Applicants see their result on membership_requests, not the internal log
-- (ZER-169 AC2).
create policy "Admins can read membership request events"
  on public.membership_request_events
  for select
  to authenticated
  using (public.is_platform_admin());

-- Backfill: creation row, plus the move to the current state when it is not
-- the initial one. Legacy rows carry no intermediate interview states.
insert into public.membership_request_events (request_id, from_estado, to_estado, actor_id, created_at)
select id, null, 'pendiente_coordinacion', profile_id, created_at
from public.membership_requests;

insert into public.membership_request_events (request_id, from_estado, to_estado, actor_id, created_at)
select id, 'pendiente_coordinacion', estado, revisado_por, actualizado_en
from public.membership_requests
where estado <> 'pendiente_coordinacion';

-- --- 5. Triggers ---

create or replace function public.membership_requests_guard_estado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado is distinct from 'pendiente_coordinacion' then
      raise exception 'Una solicitud nueva arranca en pendiente_coordinacion'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.estado is distinct from old.estado then
    if not exists (
      select 1 from public.membership_request_transitions
      where from_estado = old.estado and to_estado = new.estado
    ) then
      raise exception 'Transición inválida: % → %', old.estado, new.estado
        using errcode = 'check_violation';
    end if;
    new.actualizado_en := now();
  end if;

  return new;
end;
$$;

create trigger membership_requests_estado_guard
  before insert or update of estado on public.membership_requests
  for each row execute function public.membership_requests_guard_estado();

-- security definer: no app role may insert into the history table directly.
create or replace function public.membership_requests_log_estado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.membership_request_events (request_id, from_estado, to_estado, actor_id, motivo)
  values (
    new.id,
    case when tg_op = 'INSERT' then null else old.estado end,
    new.estado,
    auth.uid(),
    nullif(current_setting('app.membership_transition_motivo', true), '')
  );
  return null;
end;
$$;

create trigger membership_requests_estado_log_insert
  after insert on public.membership_requests
  for each row execute function public.membership_requests_log_estado();

create trigger membership_requests_estado_log_update
  after update of estado on public.membership_requests
  for each row
  when (old.estado is distinct from new.estado)
  execute function public.membership_requests_log_estado();

revoke execute on function public.membership_requests_guard_estado() from public, anon, authenticated;
revoke execute on function public.membership_requests_log_estado() from public, anon, authenticated;

-- --- 6. Transition RPC ---

create or replace function public.transition_membership_request(
  p_request_id uuid,
  p_to public.membership_request_estado,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_profile_id uuid;
  v_estado public.membership_request_estado;
  v_tier_solicitado public.tier;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  v_is_admin := public.is_platform_admin();

  -- Row lock serializes concurrent transitions on the same request.
  select profile_id, estado, tier_solicitado
  into v_profile_id, v_estado, v_tier_solicitado
  from public.membership_requests
  where id = p_request_id
  for update;

  -- Strangers get not_found, so request ids cannot be probed.
  if not found or (not v_is_admin and v_profile_id is distinct from v_uid) then
    return jsonb_build_object('error', 'Solicitud no encontrada', 'code', 'not_found');
  end if;

  if not exists (
    select 1 from public.membership_request_transitions
    where from_estado = v_estado and to_estado = p_to
  ) then
    return jsonb_build_object(
      'error', 'Ese cambio de estado no está permitido',
      'code', 'invalid_transition'
    );
  end if;

  if not exists (
    select 1 from public.membership_request_transitions
    where from_estado = v_estado
      and to_estado = p_to
      and (
        (actor = 'admin' and v_is_admin)
        or (actor = 'owner' and v_profile_id = v_uid)
      )
  ) then
    return jsonb_build_object(
      'error', 'No tenés permiso para este cambio de estado',
      'code', 'forbidden'
    );
  end if;

  -- tier_solicitado is capped to 'standard' (ZER-31): no escalation via request.
  if p_to = 'aprobado' and v_tier_solicitado is distinct from 'standard' then
    return jsonb_build_object('error', 'Tipo de membresía no soportado', 'code', 'unsupported_tier');
  end if;

  if v_motivo is not null and char_length(v_motivo) > 500 then
    return jsonb_build_object('error', 'El motivo es demasiado largo', 'code', 'invalid_motivo');
  end if;

  perform set_config('app.membership_transition_motivo', coalesce(v_motivo, ''), true);

  update public.membership_requests
  set estado = p_to,
      revisado_por = case when v_is_admin then v_uid else revisado_por end
  where id = p_request_id
    and estado = v_estado;

  perform set_config('app.membership_transition_motivo', '', true);

  if not found then
    return jsonb_build_object('error', 'La solicitud cambió, recargá', 'code', 'conflict');
  end if;

  if p_to = 'aprobado' then
    update public.profiles
    set tier = v_tier_solicitado
    where id = v_profile_id;
  end if;

  return jsonb_build_object('success', true, 'estado', p_to);
end;
$$;

revoke execute on function public.transition_membership_request(uuid, public.membership_request_estado, text)
  from public, anon;
grant execute on function public.transition_membership_request(uuid, public.membership_request_estado, text)
  to authenticated;

-- --- 7. Grants ---
-- 20260821222554_grants_dml_public.sql + default privileges hand table-level
-- DML to anon/authenticated on every public table. That made the ZER-108
-- column-level INSERT grant moot (a tourist could insert estado or
-- tier_solicitado). Narrow it back explicitly.

revoke all on public.membership_requests from anon;
revoke insert, update, delete on public.membership_requests from authenticated;

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

revoke all on public.membership_request_transitions from anon, authenticated;
grant select on public.membership_request_transitions to authenticated;

revoke all on public.membership_request_events from anon, authenticated;
grant select on public.membership_request_events to authenticated;
