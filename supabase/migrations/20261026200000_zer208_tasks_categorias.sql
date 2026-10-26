-- ZER-208: a task can have several categories, and "Otro" carries free text.
--
-- tasks.categoria (one task_categoria) becomes tasks.categorias
-- (task_categoria[]). Every existing row keeps its category as a one-item
-- array. The column grants follow the column through the rename.
--
-- categoria_otra is the text for "Otro". It is only allowed when 'otro' is one
-- of the categories. Existing 'otro' tasks have no text, so the DB does not
-- require it; the app does for new writes.
--
-- The update guard treats both columns as content (only the creator edits
-- them while abierta). Only that comparison changes in the function below.
-- Mirror: src/features/tasks/task-update-guard.ts

alter table public.tasks alter column categoria drop default;

alter table public.tasks
  alter column categoria type public.task_categoria[] using array[categoria];

alter table public.tasks rename column categoria to categorias;

alter table public.tasks alter column categorias set default '{otro}';

alter table public.tasks
  add constraint tasks_categorias_not_empty check (cardinality(categorias) >= 1);

alter table public.tasks add column categoria_otra text;

alter table public.tasks
  add constraint tasks_categoria_otra_valida check (
    categoria_otra is null
    or ('otro' = any (categorias) and length(trim(categoria_otra)) between 1 and 40)
  );

grant insert (categoria_otra), update (categoria_otra) on public.tasks to authenticated;

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
    or new.categorias is distinct from old.categorias
    or new.categoria_otra is distinct from old.categoria_otra
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

  -- Release: taker, creator, or admin. Content stays put.
  if old.estado = 'tomada'
    and new.estado = 'abierta'
    and new.tomada_por is null
    and not v_content_changed
    and (v_uid = old.tomada_por or v_uid = old.creado_por or v_admin)
  then
    return new;
  end if;

  -- Assign / reassign: creator or admin. Does not cover a random member
  -- setting tomada_por to someone else. Self-claim is the branch above.
  if (v_uid = old.creado_por or v_admin)
    and old.estado in ('abierta', 'tomada')
    and new.estado = 'tomada'
    and new.tomada_por is not null
    and not v_content_changed
    and exists (
      select 1 from public.profiles assignee
      where assignee.id = new.tomada_por
        and assignee.tier <> 'tourist'
    )
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
