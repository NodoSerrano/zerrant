-- ZER-31: RPC for atomic approve of membership requests.
-- Replaces the two-step update in application code with a single database transaction.

create or replace function public.approve_membership_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_tier_solicitado tier;
  v_estado membership_request_estado;
begin
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

  update public.membership_requests
  set estado = 'aprobada',
      revisado_por = auth.uid(),
      actualizado_en = now()
  where id = p_request_id;

  update public.profiles
  set tier = v_tier_solicitado
  where id = v_profile_id;

  return jsonb_build_object('success', true);
end;
$$;
