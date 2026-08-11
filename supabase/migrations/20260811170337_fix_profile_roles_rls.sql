-- Fix profile_roles RLS: grants, admin SELECT, enforce confirmado=false on insert, column-level update
-- ZER-30 M3.7 — review fix: la migración original no otorgaba UPDATE, el admin no podía
-- ver roles de otros usuarios, y un usuario normal podía insertar confirmado=true.

-- 1. Drop existing policies to recreate them with corrections
drop policy if exists "Cada uno ve sus propios profile_roles" on public.profile_roles;
drop policy if exists "Cada uno inserta sus propios profile_roles" on public.profile_roles;
drop policy if exists "Cada uno borra sus propios profile_roles no confirmados" on public.profile_roles;
drop policy if exists "Admin actualiza cualquier profile_role" on public.profile_roles;

-- 2. Replace grants: add UPDATE with column-level restriction
--    El grant original era `select, insert, delete` (sin `update`), por lo que PostgREST
--    devolvía 42501 antes de evaluar RLS. Ahora:
--    - SELECT y DELETE a nivel tabla (las policies ya filtran por dueño).
--    - INSERT solo permite escribir profile_id, role_id y confirmado (el with check
--      de la policy fuerza confirmado=false).
--    - UPDATE solo permite modificar confirmado: ni un admin puede cambiar profile_id o role_id
--      porque rechazaría Postgres a nivel de privilegios antes de RLS.
revoke all on public.profile_roles from authenticated;
grant select, delete on public.profile_roles to authenticated;
grant insert (profile_id, role_id, confirmado) on public.profile_roles to authenticated;
grant update (confirmado) on public.profile_roles to authenticated;

-- 3. Recreate policies with corrections

-- Normal user: see own roles (sin cambios)
create policy "Cada uno ve sus propios profile_roles" on public.profile_roles
  for select
  to authenticated
  using (profile_id = auth.uid());

-- Admin: see all profile_roles — necesario para que el panel /admin/roles pueda listar
--        las asignaciones pendientes de cualquier usuario.
create policy "Admin ve todos los profile_roles" on public.profile_roles
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ));

-- Normal user: insert own role, solo con confirmado = false.
--              La columna confirmado se fuerza a false en el with check para que un
--              usuario no pueda saltarse la aprobación del admin.
create policy "Cada uno inserta sus propios profile_roles" on public.profile_roles
  for insert
  to authenticated
  with check (profile_id = auth.uid() and confirmado = false);

-- Normal user: delete own unconfirmed roles (sin cambios)
create policy "Cada uno borra sus propios profile_roles no confirmados" on public.profile_roles
  for delete
  to authenticated
  using (profile_id = auth.uid() and confirmado = false);

-- Admin: update any profile_role (el grant por columna restringe a solo confirmado)
create policy "Admin actualiza cualquier profile_role" on public.profile_roles
  for update
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ));
