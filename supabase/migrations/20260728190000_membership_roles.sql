-- M3.1: Modelo de datos — Membresía y Roles
-- Tablas: roles, profile_roles, membership_requests
-- RLS policies + seed de roles base + entrypoint para primer admin manual.

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  created_at timestamptz not null default now()
);

create table public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  confirmado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, role_id)
);

create type membership_request_estado as enum ('pendiente', 'aprobada', 'rechazada');

create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mensaje text,
  tier_solicitado tier not null default 'standard',
  estado membership_request_estado not null default 'pendiente',
  revisado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Indexes
create index idx_profile_roles_profile on public.profile_roles(profile_id);
create index idx_profile_roles_role on public.profile_roles(role_id);
create index idx_membership_requests_profile on public.membership_requests(profile_id);
create index idx_membership_requests_estado on public.membership_requests(estado);

-- RLS: roles (catalog)
alter table public.roles enable row level security;

create policy "Anyone can read roles"
  on public.roles
  for select
  using (auth.uid() is not null);

create policy "Only admins can insert roles"
  on public.roles
  for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Only admins can update roles"
  on public.roles
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Only admins can delete roles"
  on public.roles
  for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

-- RLS: profile_roles
alter table public.profile_roles enable row level security;

create policy "Users can read own roles"
  on public.profile_roles
  for select
  using (auth.uid() = profile_id);

create policy "Admins can read all profile roles"
  on public.profile_roles
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Users can insert own role proposals"
  on public.profile_roles
  for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
  );

create policy "Users can delete own unconfirmed roles"
  on public.profile_roles
  for delete
  using (
    auth.uid() = profile_id
    and confirmado = false
  );

create policy "Only admins can confirm roles"
  on public.profile_roles
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

-- RLS: membership_requests
alter table public.membership_requests enable row level security;

create policy "Users can read own membership requests"
  on public.membership_requests
  for select
  using (auth.uid() = profile_id);

create policy "Admins can read all membership requests"
  on public.membership_requests
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Tourists can create one membership request at a time"
  on public.membership_requests
  for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'tourist'
    )
    and not exists (
      select 1 from public.membership_requests
      where profile_id = auth.uid() and estado = 'pendiente'
    )
  );

create policy "Only admins can update membership requests"
  on public.membership_requests
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

-- Seed: roles base del catálogo
insert into public.roles (nombre, descripcion) values
  ('Charlas', 'Organiza y modera charlas y eventos de formación'),
  ('Infra', 'Mantiene redes, servidores y hardware del espacio'),
  ('RRSS', 'Maneja la presencia en redes sociales'),
  ('Tesorería', 'Gestiona finanzas y aportes económicos'),
  ('Organización', 'Coordina la logística general del nodo');
