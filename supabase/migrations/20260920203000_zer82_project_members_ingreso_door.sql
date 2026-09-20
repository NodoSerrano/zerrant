-- ZER-82 / Story 5.5 — pin the projects.ingreso door on project_members INSERT.
-- A server action that "sets the right estado" is ergonomics, not a guard.
-- If this WITH CHECK does not enforce the door, the approval gate does not exist.
--
-- Contract:
--   projects.ingreso = abierto    → self-insert estado = aprobado allowed
--   projects.ingreso = aprobacion → self-insert estado = pendiente only
-- Always: profile_id = auth.uid(), is_non_tourist(), rol = miembro
-- Parent lookup reads public.projects (different table) — no project_members recursion.
-- rol stays off the INSERT grant so clients cannot claim admin at join time.

drop policy if exists "Serranos can self-join projects" on public.project_members;

create policy "Serranos can self-join projects"
  on public.project_members
  for insert
  with check (
    auth.uid() = profile_id
    and public.is_non_tourist()
    and rol = 'miembro'
    and (
      (
        estado = 'aprobado'
        and exists (
          select 1
          from public.projects p
          where p.id = project_id
            and p.ingreso = 'abierto'
        )
      )
      or (
        estado = 'pendiente'
        and exists (
          select 1
          from public.projects p
          where p.id = project_id
            and p.ingreso = 'aprobacion'
        )
      )
    )
  );

-- Allow clients to set estado on self-join; WITH CHECK above is the real gate.
-- rol remains omitted so self-admin claim stays a privilege failure.
revoke insert on public.project_members from authenticated;
grant insert (project_id, profile_id, estado)
  on public.project_members to authenticated;
