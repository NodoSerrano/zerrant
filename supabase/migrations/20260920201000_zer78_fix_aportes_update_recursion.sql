-- ZER-78 follow-up: aportes UPDATE WITH CHECK self-selected the same table and
-- raised 42P17 on every content update (same class as ZER-65). Column grants
-- already omit profile_id / registrado_por; pin ownership via USING only.

drop policy "Registrante or admin can update aportes" on public.aportes;

create policy "Registrante or admin can update aportes"
  on public.aportes
  for update
  using (
    auth.uid() = registrado_por
    or public.is_platform_admin()
  )
  with check (
    auth.uid() = registrado_por
    or public.is_platform_admin()
  );
