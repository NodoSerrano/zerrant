-- ZER-78 / Story 5.1 — M5 foundation: projects + project_members + enums + RLS + grants.
--
-- Threat model (must both hold):
-- 1) Ungranted table → PostgREST 42501 before RLS ever runs (ZER-49 defaults inherit DML;
--    explicit grants below are defensive; enable RLS in THIS same file).
-- 2) Self-referencing policy on project_members → 42P17 recursion (ZER-65). Admin checks
--    go through public.is_project_admin() security definer, never an inline subquery over
--    project_members inside a project_members policy.
--
-- PRD §6 / data-model.md:
--   projects.estado: idea | en_curso | pausado | terminado (default idea)
--   projects.ingreso: abierto | aprobacion (default aprobacion)
--   project_members.rol: miembro | admin (default miembro)
--   project_members.estado: pendiente | aprobado (default pendiente)
--   PK (project_id, profile_id)
--
-- RLS:
--   projects SELECT: any authenticated
--   projects INSERT: serrano via is_non_tourist(); creado_por = auth.uid()
--   projects UPDATE: project admin only (is_project_admin) — NOT platform admin
--   projects DELETE: no policy → denied
--   project_members SELECT: any authenticated
--   project_members INSERT: serrano self-join scaffold (ingreso door tightened in story 5.5)
--   project_members UPDATE/DELETE: project admin only
--
-- Admin meaning: project_members.rol='admin' scoped by project_id.
-- profiles.is_platform_admin is intentionally NOT folded into is_project_admin.

-- --- 1. Enums ---

create type public.project_estado as enum ('idea', 'en_curso', 'pausado', 'terminado');
create type public.project_ingreso as enum ('abierto', 'aprobacion');
create type public.project_member_rol as enum ('miembro', 'admin');
create type public.project_member_estado as enum ('pendiente', 'aprobado');

-- --- 2. Tables ---

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  estado public.project_estado not null default 'idea',
  ingreso public.project_ingreso not null default 'aprobacion',
  creado_por uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint projects_nombre_nonempty check (length(trim(nombre)) > 0)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rol public.project_member_rol not null default 'miembro',
  estado public.project_member_estado not null default 'pendiente',
  primary key (project_id, profile_id)
);

create index idx_projects_creado_por on public.projects(creado_por);
create index idx_projects_estado on public.projects(estado);
create index idx_project_members_profile on public.project_members(profile_id);

-- --- 3. Project-admin helper (security definer — avoids 42P17) ---

create or replace function public.is_project_admin(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = p_project_id
      and profile_id = auth.uid()
      and rol = 'admin'
      and estado = 'aprobado'
  );
$$;

revoke execute on function public.is_project_admin(uuid) from public;
grant execute on function public.is_project_admin(uuid) to authenticated, service_role;

-- --- 4. RLS: projects ---

alter table public.projects enable row level security;

create policy "Authenticated users can read projects"
  on public.projects
  for select
  using (auth.uid() is not null);

create policy "Serranos can create projects"
  on public.projects
  for insert
  with check (
    auth.uid() = creado_por
    and public.is_non_tourist()
  );

-- Project admin only. creado_por immutable via grant + with check pin.
create policy "Project admins can update projects"
  on public.projects
  for update
  using (public.is_project_admin(id))
  with check (
    creado_por = (select p.creado_por from public.projects p where p.id = projects.id)
    and public.is_project_admin(id)
  );

-- No DELETE policy on projects → denied for authenticated.

-- --- 5. RLS: project_members ---

alter table public.project_members enable row level security;

create policy "Authenticated users can read project members"
  on public.project_members
  for select
  using (auth.uid() is not null);

-- Self-join scaffold for serranos. Story 5.5 pins the ingreso door WITH CHECK.
create policy "Serranos can self-join projects"
  on public.project_members
  for insert
  with check (
    auth.uid() = profile_id
    and public.is_non_tourist()
  );

create policy "Project admins can update project members"
  on public.project_members
  for update
  using (public.is_project_admin(project_id))
  with check (public.is_project_admin(project_id));

create policy "Project admins can delete project members"
  on public.project_members
  for delete
  using (public.is_project_admin(project_id));

-- --- 6. Grants (PostgREST) ---

grant select on public.projects to authenticated;

grant insert (nombre, descripcion, estado, ingreso, creado_por)
  on public.projects to authenticated;

grant update (nombre, descripcion, estado, ingreso)
  on public.projects to authenticated;

-- projects DELETE intentionally ungated/denied (no DELETE privilege)

grant select on public.project_members to authenticated;

grant insert (project_id, profile_id, rol, estado)
  on public.project_members to authenticated;

grant update (rol, estado)
  on public.project_members to authenticated;

grant delete on public.project_members to authenticated;
