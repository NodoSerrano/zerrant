-- M4.1: Plantel — skills + profile_skills + plantel read policies
--
-- 1. Tablas del catálogo de habilidades y su relación N:N con profiles.
-- 2. RLS: el plantel lee perfiles serranos, sus roles y sus skills; los tourists
--    nunca aparecen (docs/roadmap/Seguridad RLS.md). skills lo administra un admin.
-- 3. Grants de PostgREST para que las políticas no mueran con 42501
--    (lección de supabase/migrations/20260725033000_grants_authenticated.sql).

-- --- 1. Tablas ---

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);

create index idx_skills_nombre on public.skills(nombre);
create index idx_profile_skills_profile on public.profile_skills(profile_id);
create index idx_profile_skills_skill on public.profile_skills(skill_id);

-- --- 2. RLS ---

-- skills: catálogo legible por cualquier autenticado, editable sólo por admins.
alter table public.skills enable row level security;

create policy "Anyone can read skills"
  on public.skills
  for select
  using (auth.uid() is not null);

create policy "Only admins can insert skills"
  on public.skills
  for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Only admins can update skills"
  on public.skills
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

create policy "Only admins can delete skills"
  on public.skills
  for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_platform_admin = true)
  );

-- profile_skills: legibles sólo si el perfil es serrano (tourists fuera del plantel),
-- y cada serrano gestiona sus propias skills.
alter table public.profile_skills enable row level security;

create policy "Anyone can read serrano profile skills"
  on public.profile_skills
  for select
  using (
    exists (select 1 from public.profiles where id = profile_id and tier <> 'tourist')
  );

create policy "Serranos can insert own skills"
  on public.profile_skills
  for insert
  with check (
    auth.uid() = profile_id
    and exists (select 1 from public.profiles where id = auth.uid() and tier <> 'tourist')
  );

create policy "Serranos can delete own skills"
  on public.profile_skills
  for delete
  using (auth.uid() = profile_id);

-- profiles: los serranos son visibles para cualquier autenticado. Las policies
-- existentes ("Users can read own profile", "Admins can read all profiles")
-- siguen vigentes; ésta se suma (OR) y deja afuera a los tiers tourist.
create policy "Anyone can read serrano profiles"
  on public.profiles
  for select
  using (tier <> 'tourist');

-- profile_roles: los roles de un serrano son legibles en el plantel (chips + filtro).
-- Complementa las policies existentes de M3 sin tocarlas.
create policy "Anyone can read serrano profile roles"
  on public.profile_roles
  for select
  using (
    exists (select 1 from public.profiles where id = profile_id and tier <> 'tourist')
  );

-- --- 3. Grants ---

grant select on public.skills to authenticated;

grant select on public.profile_skills to authenticated;

grant insert (profile_id, skill_id) on public.profile_skills to authenticated;

grant delete on public.profile_skills to authenticated;
