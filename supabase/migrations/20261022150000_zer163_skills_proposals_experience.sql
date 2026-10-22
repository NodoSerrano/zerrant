-- ZER-163: member skills.
--
-- Decisions (2026-10-20, in the issue):
--   1. Members propose new skills; they join the shared catalog only when an
--      admin approves them. Approving also adds the skill to the proposer.
--   2. Each member skill carries an optional level and, separately, years of
--      freelance and company experience.
--   3. The Plantel filter does not change (it keeps reading skill names).
--
-- Write paths for apps: propose_skill(), review_skill() (admins) and
-- save_profile_skills() (replaces the caller's skills with level and years).
-- sync_profile_skills(uuid[]) is dropped: save_profile_skills supersedes it.

-- --- 1. Catalog: approved vs pending proposals ---

create type public.skill_estado as enum ('aprobada', 'pendiente');

alter table public.skills
  add column estado public.skill_estado not null default 'aprobada',
  add column propuesta_por uuid references public.profiles (id) on delete set null;

-- One skill per name regardless of case and surrounding or repeated spaces
-- ("Diseño" and "  diseño " are the same skill).
create unique index skills_nombre_normalizado
  on public.skills (lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')));

-- Members read the approved catalog plus their own proposals; admins read all.
drop policy if exists "Anyone can read skills" on public.skills;

create policy "Authenticated read approved skills and own proposals"
  on public.skills
  for select
  to authenticated
  using (estado = 'aprobada' or propuesta_por = auth.uid() or public.is_platform_admin());

-- --- 2. Level and years on each member skill ---

create type public.skill_nivel as enum ('basico', 'intermedio', 'avanzado');

alter table public.profile_skills
  add column nivel public.skill_nivel,
  add column anios_freelance smallint
    check (anios_freelance is null or anios_freelance between 0 and 60),
  add column anios_empresa smallint
    check (anios_empresa is null or anios_empresa between 0 and 60);

-- A pending proposal cannot sit on a profile, not even through a direct insert.
drop policy if exists "Serranos can insert own skills" on public.profile_skills;

create policy "Serranos can insert own approved skills"
  on public.profile_skills
  for insert
  with check (
    auth.uid() = profile_id
    and exists (select 1 from public.profiles where id = auth.uid() and tier <> 'tourist')
    and exists (select 1 from public.skills where id = skill_id and estado = 'aprobada')
  );

-- --- 3. propose_skill: members suggest a skill for the catalog ---

create or replace function public.propose_skill(p_nombre text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tier public.tier;
  v_nombre text := regexp_replace(btrim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_id uuid;
  v_estado public.skill_estado;
  v_existing_nombre text;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select tier into v_tier from public.profiles where id = v_uid;
  if not found or v_tier = 'tourist' then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  if char_length(v_nombre) = 0 or char_length(v_nombre) > 40 then
    return jsonb_build_object(
      'error', 'La habilidad tiene que tener entre 1 y 40 caracteres',
      'code', 'invalid_nombre'
    );
  end if;

  select id, nombre, estado into v_id, v_existing_nombre, v_estado
  from public.skills
  where lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')) = lower(v_nombre);

  if found then
    return jsonb_build_object(
      'id', v_id, 'nombre', v_existing_nombre, 'estado', v_estado, 'existing', true
    );
  end if;

  begin
    insert into public.skills (nombre, estado, propuesta_por)
    values (v_nombre, 'pendiente', v_uid)
    returning id into v_id;
  exception when unique_violation then
    -- Someone proposed the same name in between: return theirs.
    select id, nombre, estado into v_id, v_existing_nombre, v_estado
    from public.skills
    where lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')) = lower(v_nombre);
    return jsonb_build_object(
      'id', v_id, 'nombre', v_existing_nombre, 'estado', v_estado, 'existing', true
    );
  end;

  return jsonb_build_object(
    'id', v_id, 'nombre', v_nombre, 'estado', 'pendiente', 'existing', false
  );
end;
$$;

-- --- 4. review_skill: admins approve or reject a proposal ---

create or replace function public.review_skill(p_skill_id uuid, p_aprobar boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado public.skill_estado;
  v_propuesta_por uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select estado, propuesta_por into v_estado, v_propuesta_por
  from public.skills
  where id = p_skill_id
  for update;

  if not found then
    return jsonb_build_object('error', 'Habilidad no encontrada', 'code', 'not_found');
  end if;

  if v_estado <> 'pendiente' then
    return jsonb_build_object('error', 'Esa habilidad ya fue revisada', 'code', 'already_reviewed');
  end if;

  if coalesce(p_aprobar, false) then
    update public.skills set estado = 'aprobada' where id = p_skill_id;
    if v_propuesta_por is not null then
      insert into public.profile_skills (profile_id, skill_id)
      values (v_propuesta_por, p_skill_id)
      on conflict (profile_id, skill_id) do nothing;
    end if;
    return jsonb_build_object('success', true, 'estado', 'aprobada');
  end if;

  delete from public.skills where id = p_skill_id;
  return jsonb_build_object('success', true, 'estado', 'rechazada');
end;
$$;

-- --- 5. save_profile_skills: replace the caller's skills, with level and years ---

create or replace function public.save_profile_skills(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tier public.tier;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select tier into v_tier from public.profiles where id = v_uid;
  if not found or v_tier = 'tourist' then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return jsonb_build_object('error', 'Datos de habilidades inválidos', 'code', 'invalid_items');
  end if;

  begin
    -- Parsed once per statement; only approved catalog skills can sit on a profile.
    with items as (
      select distinct on (skill_id)
        (item ->> 'skill_id')::uuid as skill_id,
        nullif(item ->> 'nivel', '')::public.skill_nivel as nivel,
        nullif(item ->> 'anios_freelance', '')::smallint as anios_freelance,
        nullif(item ->> 'anios_empresa', '')::smallint as anios_empresa
      from jsonb_array_elements(p_items) as item
    )
    delete from public.profile_skills
    where profile_id = v_uid
      and skill_id not in (select skill_id from items where skill_id is not null);

    with items as (
      select distinct on (skill_id)
        (item ->> 'skill_id')::uuid as skill_id,
        nullif(item ->> 'nivel', '')::public.skill_nivel as nivel,
        nullif(item ->> 'anios_freelance', '')::smallint as anios_freelance,
        nullif(item ->> 'anios_empresa', '')::smallint as anios_empresa
      from jsonb_array_elements(p_items) as item
    )
    insert into public.profile_skills (profile_id, skill_id, nivel, anios_freelance, anios_empresa)
    select v_uid, items.skill_id, items.nivel, items.anios_freelance, items.anios_empresa
    from items
    join public.skills s on s.id = items.skill_id and s.estado = 'aprobada'
    on conflict (profile_id, skill_id) do update
      set nivel = excluded.nivel,
          anios_freelance = excluded.anios_freelance,
          anios_empresa = excluded.anios_empresa;
  exception
    -- Bad level, non-numeric or out-of-range years, malformed id: nothing is
    -- written (the block rolls back) and the caller gets a stable code.
    when invalid_text_representation or check_violation or numeric_value_out_of_range
      or invalid_parameter_value then
      return jsonb_build_object('error', 'Datos de habilidades inválidos', 'code', 'invalid_items');
  end;

  return jsonb_build_object('success', true);
end;
$$;

drop function if exists public.sync_profile_skills(uuid[]);

-- --- 6. Grants ---

revoke execute on function public.propose_skill(text) from public, anon;
revoke execute on function public.review_skill(uuid, boolean) from public, anon;
revoke execute on function public.save_profile_skills(jsonb) from public, anon;

grant execute on function public.propose_skill(text) to authenticated;
grant execute on function public.review_skill(uuid, boolean) to authenticated;
grant execute on function public.save_profile_skills(jsonb) to authenticated;
