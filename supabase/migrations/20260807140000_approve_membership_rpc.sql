-- ZER-31: RPC for atomic approve of membership requests.
-- Replaces the two-step update in application code with a single database transaction.
--
-- ZER-31 review fix: the function is security definer, so it MUST verify the
-- caller is a platform admin before mutating anything, and EXECUTE must be
-- revoked from PUBLIC/anon (only authenticated callers may attempt it — the
-- in-function check is what actually gates authorization).

create or replace function public.approve_membership_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  -- Con `set search_path = ''` los tipos del DECLARE deben ir calificados,
  -- si no CREATE FUNCTION falla con "type does not exist" en DBs frescas.
  v_profile_id uuid;
  v_tier_solicitado public.tier;
  v_estado public.membership_request_estado;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ) then
    return jsonb_build_object('error', 'Solo un admin puede aprobar solicitudes');
  end if;

  select profile_id, tier_solicitado, estado
  into v_profile_id, v_tier_solicitado, v_estado
  from public.membership_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('error', 'Solicitud no encontrada');
  end if;

  if v_estado != 'pendiente' then
    return jsonb_build_object('error', 'La solicitud ya fue procesada');
  end if;

  -- ZER-31 review fix: tier_solicitado is client-supplied; cap to 'standard'
  -- so a tourist cannot escalate to scholar/founder via the request itself.
  if v_tier_solicitado is distinct from 'standard' then
    return jsonb_build_object('error', 'Tipo de membresía no soportado');
  end if;

  -- ZER-31 review fix (TOCTOU): the state guard must live in the UPDATE too, or
  -- a concurrent reject (or second approve) committed between the read above and
  -- this write would be overwritten. `and estado = 'pendiente'` makes the claim
  -- atomic; FOUND confirms exactly one row was flipped.
  update public.membership_requests
  set estado = 'aprobada',
      revisado_por = auth.uid(),
      actualizado_en = now()
  where id = p_request_id
    and estado = 'pendiente';

  if not found then
    return jsonb_build_object('error', 'La solicitud ya fue procesada');
  end if;

  update public.profiles
  set tier = v_tier_solicitado
  where id = v_profile_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.approve_membership_request(uuid) from public, anon;
grant execute on function public.approve_membership_request(uuid) to authenticated;
