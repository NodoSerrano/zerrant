-- ZER-166 — Donaciones del Nodo: extend M6 aportes with approval + inventory fields.
--
-- Product package (2026-10-19):
--   UI name: "Donaciones del Nodo"
--   UI tipos: regalo | por un tiempo → existing aporte_tipo donacion | prestamo
--   No valor estimado / no monetary charge fields
--   Image optional (storage bucket donaciones)
--
-- Legacy M6 ledger rows keep estado IS NULL (no approval queue).
-- Donation flow inserts estado = 'pendiente'.
--
-- Approve/reject only via security definer RPCs (no self-approve:
-- profile_id <> auth.uid()). Direct grants omit approval columns.
--
-- SELECT: admin | non-tourist AND (estado is null | aprobado | own row).
-- Tourists never read (AC3).

-- --- 1. Enum ---

create type public.aporte_estado as enum (
  'pendiente',
  'aprobado',
  'rechazado'
);

-- --- 2. Columns on aportes ---

alter table public.aportes
  add column titulo text,
  add column estado public.aporte_estado,
  add column imagen_path text,
  add column aprobado_por uuid references public.profiles(id) on delete set null,
  add column aprobado_en timestamptz,
  add column notas_admin text;

create index idx_aportes_estado on public.aportes(estado);
create index idx_aportes_estado_fecha on public.aportes(estado, fecha desc);

comment on column public.aportes.estado is
  'null = M6 ledger (no approval). pendiente/aprobado/rechazado = Donaciones del Nodo workflow.';
comment on column public.aportes.titulo is
  'Short title for material donations (e.g. Televisor 32" living). Optional on legacy ledger rows.';

-- --- 3. RLS SELECT (replace) ---

drop policy if exists "Serranos can read aportes" on public.aportes;

create policy "Serranos can read aportes"
  on public.aportes
  for select
  using (
    public.is_platform_admin()
    or (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and tier <> 'tourist'
      )
      and (
        estado is null
        or estado = 'aprobado'
        or profile_id = auth.uid()
      )
    )
  );

-- Owner may update/delete only pending donations or legacy ledger (estado null).
-- Platform admin always. Approval transitions go through RPC only.

drop policy if exists "Registrante or admin can update aportes" on public.aportes;

create policy "Registrante or admin can update aportes"
  on public.aportes
  for update
  using (
    public.is_platform_admin()
    or (
      auth.uid() = registrado_por
      and (estado is null or estado = 'pendiente')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      auth.uid() = registrado_por
      and (estado is null or estado = 'pendiente')
    )
  );

drop policy if exists "Registrante or admin can delete aportes" on public.aportes;

create policy "Registrante or admin can delete aportes"
  on public.aportes
  for delete
  using (
    public.is_platform_admin()
    or (
      auth.uid() = registrado_por
      and (estado is null or estado = 'pendiente')
    )
  );

-- --- 4. Column grants (re-assert + donation fields; no approval cols on UPDATE) ---

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
  imagen_path
) on public.aportes to authenticated;

grant update (
  tipo,
  descripcion,
  monto,
  fecha,
  titulo,
  imagen_path
) on public.aportes to authenticated;

-- --- 5. Approve / reject RPCs ---

create or replace function public.approve_aporte_donacion(
  p_aporte_id uuid,
  p_notas text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_estado public.aporte_estado;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ) then
    return jsonb_build_object('error', 'Solo un admin puede aprobar donaciones');
  end if;

  select profile_id, estado
  into v_profile_id, v_estado
  from public.aportes
  where id = p_aporte_id;

  if not found then
    return jsonb_build_object('error', 'Donación no encontrada');
  end if;

  if v_estado is distinct from 'pendiente' then
    return jsonb_build_object('error', 'La donación ya fue procesada');
  end if;

  -- AC2: no self-approve
  if v_profile_id = auth.uid() then
    return jsonb_build_object('error', 'No podés aprobar tu propia donación');
  end if;

  update public.aportes
  set estado = 'aprobado',
      aprobado_por = auth.uid(),
      aprobado_en = now(),
      notas_admin = nullif(trim(coalesce(p_notas, '')), '')
  where id = p_aporte_id
    and estado = 'pendiente'
    and profile_id <> auth.uid();

  if not found then
    return jsonb_build_object('error', 'La donación ya fue procesada');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.reject_aporte_donacion(
  p_aporte_id uuid,
  p_notas text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_estado public.aporte_estado;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ) then
    return jsonb_build_object('error', 'Solo un admin puede rechazar donaciones');
  end if;

  select profile_id, estado
  into v_profile_id, v_estado
  from public.aportes
  where id = p_aporte_id;

  if not found then
    return jsonb_build_object('error', 'Donación no encontrada');
  end if;

  if v_estado is distinct from 'pendiente' then
    return jsonb_build_object('error', 'La donación ya fue procesada');
  end if;

  if v_profile_id = auth.uid() then
    return jsonb_build_object('error', 'No podés rechazar tu propia donación');
  end if;

  update public.aportes
  set estado = 'rechazado',
      aprobado_por = auth.uid(),
      aprobado_en = now(),
      notas_admin = nullif(trim(coalesce(p_notas, '')), '')
  where id = p_aporte_id
    and estado = 'pendiente'
    and profile_id <> auth.uid();

  if not found then
    return jsonb_build_object('error', 'La donación ya fue procesada');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.approve_aporte_donacion(uuid, text) from public, anon;
revoke execute on function public.reject_aporte_donacion(uuid, text) from public, anon;
grant execute on function public.approve_aporte_donacion(uuid, text) to authenticated;
grant execute on function public.reject_aporte_donacion(uuid, text) to authenticated;

-- --- 6. Storage bucket for optional donation images ---

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donaciones',
  'donaciones',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Donacion images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'donaciones');

create policy "Users can upload own donacion images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'donaciones'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update own donacion images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'donaciones'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'donaciones'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete own donacion images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'donaciones'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
