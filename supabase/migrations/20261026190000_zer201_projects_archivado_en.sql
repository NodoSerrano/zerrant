-- ZER-201: archiving gets its own mark instead of reusing estado = 'terminado'.
-- Until now "Archivar" set estado to terminado, so an archived project (even one
-- that was En curso) read as Terminado and stayed in every list.
--
-- A nullable timestamp, not a new project_estado value. Archiving also sets
-- estado = pausado (the app does it in the same update), so an archived project
-- reads as paused, never as finished.
--
-- Who can set it is the existing UPDATE policy (project admins only). It is not
-- in the INSERT grant: a project is never created archived.
--
-- Projects archived before this migration stay as terminado: nothing tells them
-- apart from projects that really finished.

alter table public.projects
  add column archivado_en timestamptz;

comment on column public.projects.archivado_en is
  'When a project admin archived it (ZER-201). Null = active.';

grant update (archivado_en) on public.projects to authenticated;
