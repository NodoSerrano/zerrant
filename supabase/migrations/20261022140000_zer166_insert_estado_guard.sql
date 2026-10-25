-- ZER-166 hardening — block client INSERT of estado aprobado/rechazado.
-- M6 ledger rows keep estado IS NULL; donation queue must start as pendiente.
-- Approval/rejection remains RPC-only (approve_aporte_donacion / reject_aporte_donacion).

drop policy if exists "Owner or admin can insert aportes" on public.aportes;

create policy "Owner or admin can insert aportes"
  on public.aportes
  for insert
  with check (
    auth.uid() = registrado_por
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
    and (
      auth.uid() = profile_id
      or public.is_platform_admin()
    )
    and (
      estado is null
      or estado = 'pendiente'
    )
  );
