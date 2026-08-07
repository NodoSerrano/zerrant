-- ZER-31 review fixes (PR #12) for the admin membership queue.
--
-- 1. reject_membership_request RPC — mirror of approve: atomic single-statement
--    update guarded by `estado = 'pendiente'`, admin-only, EXECUTE restricted to
--    `authenticated`. Fixes the non-atomic reject + approve/reject race where a
--    request could end up `rechazada` while the profile tier was already granted.
-- 2. Admin SELECT policy on profiles — the admin page embeds
--    `profiles!membership_requests_profile_id_fkey(...)`; the only pre-existing
--    policy ("Users can read own profile") filtered the embed to null for other
--    users' requests, crashing RequestCard. Admins may now read every profile.
-- 3. Column grants for the M3.1 tables (membership_requests / profile_roles /
--    roles) — the tables were created with RLS but no PostgREST grants, so any
--    select/insert/update died with 42501. `tier_solicitado` stays out of the
--    insert grant so the server default ('standard') applies and a tourist cannot
--    self-select an escalated tier.

-- --- 1. reject_membership_request RPC ---

create or replace function public.reject_membership_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ) then
    return jsonb_build_object('error', 'Solo un admin puede rechazar solicitudes');
  end if;

  update public.membership_requests
  set estado = 'rechazada',
      revisado_por = auth.uid(),
      actualizado_en = now()
  where id = p_request_id
    and estado = 'pendiente';

  if not found then
    if not exists (
      select 1 from public.membership_requests where id = p_request_id
    ) then
      return jsonb_build_object('error', 'Solicitud no encontrada');
    end if;
    return jsonb_build_object('error', 'La solicitud ya fue procesada');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.reject_membership_request(uuid) from public, anon;
grant execute on function public.reject_membership_request(uuid) to authenticated;

-- --- 2. Admin SELECT policy on profiles ---

create policy "Admins can read all profiles"
  on public.profiles
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

-- --- 3. Column grants for M3.1 tables ---

grant select on public.membership_requests to authenticated;

grant insert (
  profile_id,
  mensaje
) on public.membership_requests to authenticated;

grant select on public.profile_roles to authenticated;

grant select on public.roles to authenticated;
