-- M3.1: membership_requests, roles, profile_roles + RLS

-- Catálogo de roles comunitarios
create table if not exists public.roles (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique
);

-- Relación N:N perfil ↔ rol, autoasignado + confirmado por admin
create table if not exists public.profile_roles (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role_id     uuid not null references public.roles(id) on delete cascade,
  confirmado  boolean not null default false,
  primary key (profile_id, role_id)
);

-- Solicitudes de membresía Tourist → Serrano
create table if not exists public.membership_requests (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  mensaje      text,
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  resuelta_por uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

-- RLS: todos los autenticados pueden leer el catálogo de roles
alter table public.roles enable row level security;
create policy "Roles visibles por todos los autenticados" on public.roles
  for select
  to authenticated
  using (true);

-- RLS: profile_roles — cada uno propone sus propios roles; solo admin cambia confirmado
alter table public.profile_roles enable row level security;
create policy "Cada uno ve sus propios profile_roles" on public.profile_roles
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Cada uno inserta sus propios profile_roles" on public.profile_roles
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Cada uno borra sus propios profile_roles no confirmados" on public.profile_roles
  for delete
  to authenticated
  using (profile_id = auth.uid() and confirmado = false);

-- Solo admin puede actualizar confirmado
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

-- RLS: membership_requests — el dueño crea y lee la suya; los admins ven todas
alter table public.membership_requests enable row level security;
create policy "Dueño crea su solicitud" on public.membership_requests
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Dueño lee su solicitud" on public.membership_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or exists (
    select 1 from public.profiles
    where id = auth.uid() and is_platform_admin = true
  ));

create policy "Admin actualiza solicitudes" on public.membership_requests
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

-- GRANT a authenticated
grant select, insert, delete on public.profile_roles to authenticated;
grant select, insert, update on public.membership_requests to authenticated;
grant select on public.roles to authenticated;

-- Seed: roles comunitarios iniciales
insert into public.roles (nombre) values
  ('Infra'),
  ('RRSS'),
  ('Charlas'),
  ('Organización'),
  ('Tesorería'),
  ('Eventos'),
  ('Comunicación'),
  ('Mantenimiento')
on conflict (nombre) do nothing;
