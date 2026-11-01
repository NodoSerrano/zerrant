-- ZER-202 (2/2): reject keeps history + reason; Inicio notices for the requester.
-- Story 5.6 deleted on reject; QA needs motivo + dismissible outcome on Inicio.

alter table public.project_members
  add column if not exists motivo_rechazo text,
  add column if not exists decidido_en timestamptz,
  add column if not exists decidido_por uuid references public.profiles(id),
  add column if not exists aviso_visto_en timestamptz;

-- motivo required iff estado = rechazado
alter table public.project_members
  drop constraint if exists project_members_motivo_rechazo_check;

alter table public.project_members
  add constraint project_members_motivo_rechazo_check
  check (
    (estado = 'rechazado' and motivo_rechazo is not null and length(btrim(motivo_rechazo)) > 0)
    or (estado is distinct from 'rechazado' and motivo_rechazo is null)
  );

-- Column-level UPDATE grant: decision fields + dismiss marker
grant update (
  rol,
  estado,
  motivo_rechazo,
  decidido_en,
  decidido_por,
  aviso_visto_en
) on public.project_members to authenticated;

-- Re-request after reject: owner may move their own rechazado row back to pendiente/aprobado.
drop policy if exists "Members can re-request after reject" on public.project_members;

create policy "Members can re-request after reject"
  on public.project_members
  for update
  using (
    profile_id = auth.uid()
    and is_non_tourist()
    and estado = 'rechazado'
  )
  with check (
    profile_id = auth.uid()
    and is_non_tourist()
    and rol = 'miembro'
    and estado in ('pendiente', 'aprobado')
    and motivo_rechazo is null
  );

-- Requester may mark their own join-outcome notice as seen.
drop policy if exists "Members can dismiss own join notice" on public.project_members;

create policy "Members can dismiss own join notice"
  on public.project_members
  for update
  using (
    profile_id = auth.uid()
    and is_non_tourist()
    and estado in ('aprobado', 'rechazado')
    and decidido_en is not null
  )
  with check (
    profile_id = auth.uid()
    and is_non_tourist()
    and estado in ('aprobado', 'rechazado')
    and decidido_en is not null
  );

-- Non-admins updating their own row may only change aviso_visto_en, or re-open rechazado.
create or replace function public.project_members_self_update_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_project_admin(new.project_id) then
    return new;
  end if;

  if auth.uid() is distinct from old.profile_id then
    return new;
  end if;

  -- Re-request after reject
  if old.estado = 'rechazado'
     and new.estado in ('pendiente', 'aprobado')
     and new.rol = 'miembro'
     and new.motivo_rechazo is null
     and new.project_id is not distinct from old.project_id
     and new.profile_id is not distinct from old.profile_id
  then
    return new;
  end if;

  -- Dismiss notice: only aviso_visto_en may change
  if new.estado is not distinct from old.estado
     and new.rol is not distinct from old.rol
     and new.motivo_rechazo is not distinct from old.motivo_rechazo
     and new.decidido_en is not distinct from old.decidido_en
     and new.decidido_por is not distinct from old.decidido_por
     and new.project_id is not distinct from old.project_id
     and new.profile_id is not distinct from old.profile_id
     and new.created_at is not distinct from old.created_at
  then
    return new;
  end if;

  raise exception 'not allowed';
end;
$$;

drop trigger if exists trg_project_members_self_update_guard on public.project_members;

create trigger trg_project_members_self_update_guard
  before update on public.project_members
  for each row
  execute function public.project_members_self_update_guard();

revoke all on function public.project_members_self_update_guard() from public;
grant execute on function public.project_members_self_update_guard() to authenticated, service_role;
