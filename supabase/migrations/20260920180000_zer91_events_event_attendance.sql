-- ZER-91 / Story 6.5 — M6 foundation: events + event_attendance + RLS + grants.
--
-- PRD §6: events has no lifecycle `estado` column. Only event_attendance.estado
-- (voy / quizas / no, no accent). Admin = profiles.is_platform_admin (not M5
-- project admin).
--
-- RLS (docs/roadmap/Seguridad RLS.md):
--   events: read authenticated; write serrano; update/delete creator or platform admin
--   event_attendance: each user manages own row; authenticated may SELECT (attendee list)
--
-- Grants: column-level DML so creado_por cannot be rewritten via PostgREST UPDATE.
-- ZER-49 default privileges cover new tables; explicit grants remain defensive.

-- --- 1. Enum ---

create type public.event_attendance_estado as enum ('voy', 'quizas', 'no');

-- --- 2. Tables ---

create table public.events (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  lugar text,
  inicio timestamptz not null,
  fin timestamptz,
  creado_por uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint events_titulo_nonempty check (length(trim(titulo)) > 0),
  constraint events_fin_after_inicio check (fin is null or fin >= inicio)
);

create table public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  estado public.event_attendance_estado not null,
  primary key (event_id, profile_id)
);

create index idx_events_inicio on public.events(inicio);
create index idx_events_creado_por on public.events(creado_por);
create index idx_event_attendance_profile on public.event_attendance(profile_id);

-- --- 3. RLS: events ---

alter table public.events enable row level security;

create policy "Authenticated users can read events"
  on public.events
  for select
  using (auth.uid() is not null);

create policy "Serranos can create events"
  on public.events
  for insert
  with check (
    auth.uid() = creado_por
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
  );

-- Creator or platform admin may update content; creado_por stays immutable
-- (grant omits creado_por; with check also pins the existing value).
create policy "Creator or admin can update events"
  on public.events
  for update
  using (
    auth.uid() = creado_por
    or public.is_platform_admin()
  )
  with check (
    creado_por = (select e.creado_por from public.events e where e.id = events.id)
    and (
      auth.uid() = creado_por
      or public.is_platform_admin()
    )
  );

create policy "Creator or admin can delete events"
  on public.events
  for delete
  using (
    auth.uid() = creado_por
    or public.is_platform_admin()
  );

-- --- 4. RLS: event_attendance ---

alter table public.event_attendance enable row level security;

create policy "Authenticated users can read event attendance"
  on public.event_attendance
  for select
  using (auth.uid() is not null);

create policy "Serranos can insert own attendance"
  on public.event_attendance
  for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier <> 'tourist'
    )
  );

create policy "Users can update own attendance"
  on public.event_attendance
  for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users can delete own attendance"
  on public.event_attendance
  for delete
  using (auth.uid() = profile_id);

-- --- 5. Grants (PostgREST) ---

grant select on public.events to authenticated;

grant insert (titulo, descripcion, lugar, inicio, fin, creado_por)
  on public.events to authenticated;

grant update (titulo, descripcion, lugar, inicio, fin)
  on public.events to authenticated;

grant delete on public.events to authenticated;

grant select on public.event_attendance to authenticated;

grant insert (event_id, profile_id, estado)
  on public.event_attendance to authenticated;

grant update (estado)
  on public.event_attendance to authenticated;

grant delete on public.event_attendance to authenticated;
