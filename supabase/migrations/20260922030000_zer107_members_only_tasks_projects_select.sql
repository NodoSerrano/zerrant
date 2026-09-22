-- ZER-107: tasks / projects / project_members SELECT is members-only.
-- Member of the Nodo = non-tourist (public.is_non_tourist()), same axis as plantel
-- and create policies. Tourists must not read community task/project rows via PostgREST.

-- tasks
drop policy if exists "Authenticated users can read tasks" on public.tasks;
drop policy if exists "Members can read tasks" on public.tasks;

create policy "Members can read tasks"
  on public.tasks
  for select
  using (public.is_non_tourist());

-- projects
drop policy if exists "Authenticated users can read projects" on public.projects;
drop policy if exists "Members can read projects" on public.projects;

create policy "Members can read projects"
  on public.projects
  for select
  using (public.is_non_tourist());

-- project_members (aligned with projects visibility)
drop policy if exists "Authenticated users can read project members" on public.project_members;
drop policy if exists "Members can read project members" on public.project_members;

create policy "Members can read project members"
  on public.project_members
  for select
  using (public.is_non_tourist());
