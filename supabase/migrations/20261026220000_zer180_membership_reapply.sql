-- ZER-180: someone whose membership request was closed (cerrada) can apply
-- again 30 days after it closed, or earlier if a platform admin enables it.
--
-- Until now the block lived only in the app (ZER-136): RLS lets the owner
-- insert and the unique index only covers active requests, so a direct
-- PostgREST insert could skip it. The rule now lives here, in a BEFORE INSERT
-- trigger, and the app mirrors it (src/features/membership/reapply.ts).
--
-- cerrada_en: when the request closed. Stamped on the move to cerrada; old
-- rows are backfilled from the event log, falling back to actualizado_en.
-- The owner can read it (the event log is admin-only), so the status page can
-- say from when they can apply again.
--
-- reapertura_habilitada_en/_por: a platform admin let this person apply again
-- before the 30 days. Only the enable_membership_reapplication RPC writes them.

alter table public.membership_requests
  add column cerrada_en timestamptz,
  add column reapertura_habilitada_en timestamptz,
  add column reapertura_habilitada_por uuid references public.profiles (id) on delete set null;

update public.membership_requests r
set cerrada_en = coalesce(
  (
    select max(e.created_at)
    from public.membership_request_events e
    where e.request_id = r.id and e.to_estado = 'cerrada'
  ),
  r.actualizado_en
)
where r.estado = 'cerrada';

-- Index for the gate below: the latest closed request of a profile.
create index idx_membership_requests_profile_cerrada
  on public.membership_requests (profile_id, cerrada_en desc)
  where estado = 'cerrada';

-- --- Stamp cerrada_en on close ---

create or replace function public.membership_requests_stamp_cerrada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado = 'cerrada' and old.estado is distinct from 'cerrada' then
    new.cerrada_en := now();
  end if;
  return new;
end;
$$;

create trigger membership_requests_cerrada_stamp
  before update of estado on public.membership_requests
  for each row execute function public.membership_requests_stamp_cerrada();

revoke execute on function public.membership_requests_stamp_cerrada() from public, anon, authenticated;

-- --- Reapply gate ---

-- security definer so the check sees every closed request of the profile,
-- whatever RLS lets the inserting role read.
create or replace function public.membership_requests_reapply_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cerrada_en timestamptz;
  v_habilitada_en timestamptz;
begin
  select cerrada_en, reapertura_habilitada_en
  into v_cerrada_en, v_habilitada_en
  from public.membership_requests
  where profile_id = new.profile_id
    and estado = 'cerrada'
  order by cerrada_en desc nulls last, actualizado_en desc, id desc
  limit 1;

  if found
    and v_habilitada_en is null
    and (v_cerrada_en is null or v_cerrada_en > now() - interval '30 days')
  then
    -- P0001, not 42501: a real privilege deny must not look like the cooldown.
    raise exception 'membership request denied: reapply cooldown'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger membership_requests_reapply_gate
  before insert on public.membership_requests
  for each row execute function public.membership_requests_reapply_gate();

revoke execute on function public.membership_requests_reapply_gate() from public, anon, authenticated;

-- --- Admin enables a new request early ---

create or replace function public.enable_membership_reapplication(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile uuid;
  v_latest uuid;
begin
  if v_uid is null or not public.is_platform_admin() then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select profile_id into v_profile
  from public.membership_requests
  where id = p_request_id
    and estado = 'cerrada';

  if not found then
    return jsonb_build_object(
      'error', 'Esa solicitud no está cerrada o ya tiene habilitada una nueva',
      'code', 'not_applicable'
    );
  end if;

  -- Same row the insert gate reads. Enabling an older close must not look like success.
  select id into v_latest
  from public.membership_requests
  where profile_id = v_profile
    and estado = 'cerrada'
  order by cerrada_en desc nulls last, actualizado_en desc, id desc
  limit 1;

  if v_latest is distinct from p_request_id then
    return jsonb_build_object(
      'error', 'Solo se puede habilitar la solicitud cerrada más reciente',
      'code', 'not_applicable'
    );
  end if;

  update public.membership_requests
  set reapertura_habilitada_en = now(),
      reapertura_habilitada_por = v_uid
  where id = p_request_id
    and estado = 'cerrada'
    and reapertura_habilitada_en is null;

  if not found then
    return jsonb_build_object(
      'error', 'Esa solicitud no está cerrada o ya tiene habilitada una nueva',
      'code', 'not_applicable'
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.enable_membership_reapplication(uuid) from public, anon;
grant execute on function public.enable_membership_reapplication(uuid) to authenticated;

-- New columns inherit table privileges. Lock them so the owner cannot stamp
-- the enable flag (or the close date) and skip the gate. The stamp trigger
-- and this RPC are security definer, so they can still write.
revoke insert (cerrada_en, reapertura_habilitada_en, reapertura_habilitada_por),
       update (cerrada_en, reapertura_habilitada_en, reapertura_habilitada_por)
  on public.membership_requests
  from public, anon, authenticated;
