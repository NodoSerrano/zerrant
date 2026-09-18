-- ZER-42: split tasks UPDATE surface — creator content vs taker transitions.
--
-- Root cause: policy "Serranos can update tasks they took" allowed creado_por OR
-- tomada_por on the whole row, and grants included titulo/descripcion/estado.
-- A taker JWT could PATCH estado='verificada' (bypass verifyTask admin gate) and
-- rewrite content. ZER-22 only hardened server actions.
--
-- Approach A + BEFORE UPDATE trigger:
--   RLS still gates who may touch a row; the trigger enforces allowed transitions
--   and which columns may change (Postgres RLS cannot filter columns alone).
-- Mirror: src/features/tasks/task-update-guard.ts
--
-- Manual security plan (A creator / B taker / admin):
--   1. A creates abierta task
--   2. B claims → tomada
--   3. B PATCH estado=verificada → deny (exception)
--   4. B PATCH titulo → deny
--   5. B mark hecha via action/update → ok
--   6. B verify → deny; admin hecha→verificada → ok
--   7. A cancel tomada → ok; B cancel → deny
--   8. A edit content abierta → ok; after tomada → deny

drop policy if exists "Serranos can update tasks they took" on public.tasks;

-- Row visibility for UPDATE (OR across policies). Fine-grained rules live in the trigger.
create policy "Task creator can update own tasks"
  on public.tasks
  for update
  using (auth.uid() = creado_por)
  with check (auth.uid() = creado_por);

create policy "Task taker can update taken tasks"
  on public.tasks
  for update
  using (auth.uid() = tomada_por)
  with check (auth.uid() = tomada_por);

-- Claim: row still has tomada_por null, so taker policy does not match OLD row.
-- Allow authenticated non-tourist to start an UPDATE on an open unclaimed task;
-- the trigger requires NEW.tomada_por = auth.uid() and estado tomada.
create policy "Serranos can claim open tasks"
  on public.tasks
  for update
  using (
    auth.uid() is not null
    and estado = 'abierta'
    and tomada_por is null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tier <> 'tourist'
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tier <> 'tourist'
    )
  );

create policy "Admins can update tasks"
  on public.tasks
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.enforce_task_update_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.is_platform_admin();
  v_content_changed boolean;
begin
  -- PostgREST user JWTs always set auth.uid(). Null uid = service_role / SQL
  -- maintainer (RLS bypassed); do not block seeds or admin scripts.
  if v_uid is null then
    return new;
  end if;

  if new.creado_por is distinct from old.creado_por then
    raise exception 'task update denied: creado_por is immutable'
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'task update denied: immutable columns'
      using errcode = '42501';
  end if;

  v_content_changed :=
    new.titulo is distinct from old.titulo
    or new.descripcion is distinct from old.descripcion
    or new.categoria is distinct from old.categoria
    or new.urgencia is distinct from old.urgencia;

  -- Admin verify: hecha → verificada, estado only
  if v_admin
    and old.estado = 'hecha'
    and new.estado = 'verificada'
    and new.tomada_por is not distinct from old.tomada_por
    and not v_content_changed
  then
    return new;
  end if;

  -- Claim open task
  if old.estado = 'abierta'
    and old.tomada_por is null
    and new.estado = 'tomada'
    and new.tomada_por = v_uid
    and not v_content_changed
  then
    return new;
  end if;

  -- Taker marks done
  if v_uid = old.tomada_por
    and old.estado = 'tomada'
    and new.estado = 'hecha'
    and new.tomada_por is not distinct from old.tomada_por
    and not v_content_changed
  then
    return new;
  end if;

  -- Creator cancels
  if v_uid = old.creado_por
    and old.estado in ('abierta', 'tomada')
    and new.estado = 'cancelada'
    and new.tomada_por is not distinct from old.tomada_por
    and not v_content_changed
  then
    return new;
  end if;

  -- Creator edits content while abierta
  if v_uid = old.creado_por
    and old.estado = 'abierta'
    and new.estado = 'abierta'
    and new.tomada_por is not distinct from old.tomada_por
  then
    return new;
  end if;

  if new.estado = 'verificada' and old.estado is distinct from 'verificada' then
    raise exception 'task update denied: only admin may set verificada'
      using errcode = '42501';
  end if;

  if v_content_changed and v_uid = old.tomada_por and v_uid is distinct from old.creado_por then
    raise exception 'task update denied: taker cannot edit content'
      using errcode = '42501';
  end if;

  raise exception 'task update denied: transition not allowed'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_enforce_task_update_guard on public.tasks;

create trigger trg_enforce_task_update_guard
  before update on public.tasks
  for each row
  execute function public.enforce_task_update_guard();

revoke all on function public.enforce_task_update_guard() from public, anon, authenticated;
