-- ZER-84: tighten project_members UPDATE so admins cannot promote a pendiente row
-- to rol=admin. Approving (estado → aprobado) and promoting (rol → admin on
-- aprobado) remain allowed. is_project_admin stays the only authority — never
-- profiles.is_platform_admin. Lookups stay in the security definer helper.

drop policy if exists "Project admins can update project members" on public.project_members;

create policy "Project admins can update project members"
  on public.project_members
  for update
  using (public.is_project_admin(project_id))
  with check (
    public.is_project_admin(project_id)
    and (rol <> 'admin' or estado = 'aprobado')
  );
