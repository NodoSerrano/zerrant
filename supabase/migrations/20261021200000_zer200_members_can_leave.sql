-- ZER-200: members can leave a project on their own. Until now only project
-- admins could delete project_members rows.
--
-- Only the viewer's own row. The last approved admin still cannot leave: the
-- ZER-199 trigger (ensure_project_keeps_admin) refuses that delete.

create policy "Members can leave projects"
  on public.project_members
  for delete
  using (auth.uid() = profile_id);
