-- ZER-142: first-party interview slots (not Calendly / Google Calendar).
-- Decision: keep occupancy in Postgres so a unique (slot_id) is the
-- double-booking lock. No applicant PII, tokens, or calendar ids leave the app.
-- Reschedule (ZER-144) can add cancelled_at later; this unique on request_id
-- is the "one live booking" starting point.

create table public.interview_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  interviewer_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create unique index interview_slots_interviewer_starts
  on public.interview_slots (interviewer_id, starts_at);

create table public.interview_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.interview_slots (id) on delete restrict,
  request_id uuid not null references public.membership_requests (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (slot_id),
  unique (request_id)
);

create index interview_bookings_profile on public.interview_bookings (profile_id);
create index interview_bookings_request on public.interview_bookings (request_id);

alter table public.interview_slots enable row level security;
alter table public.interview_bookings enable row level security;

-- Occupancy without leaking who booked (RLS on bookings would otherwise make
-- taken slots look free to other applicants).
create view public.interview_slot_availability
with (security_invoker = false, security_barrier = true) as
select
  s.id,
  s.starts_at,
  s.ends_at,
  s.interviewer_id,
  exists (
    select 1 from public.interview_bookings b where b.slot_id = s.id
  ) as booked
from public.interview_slots s;

grant select on public.interview_slot_availability to authenticated, service_role;
revoke all on public.interview_slot_availability from anon;

create policy "Authenticated can read interview slots"
  on public.interview_slots
  for select
  to authenticated
  using (true);

create policy "Owner can read own interview bookings"
  on public.interview_bookings
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Admins can read all interview bookings"
  on public.interview_bookings
  for select
  to authenticated
  using (public.is_platform_admin());

revoke all on public.interview_slots from anon, authenticated;
revoke all on public.interview_bookings from anon, authenticated;
grant select on public.interview_slots to authenticated;
grant select on public.interview_bookings to authenticated;

-- --- create slot (admin) ---

create or replace function public.create_interview_slot(p_starts_at timestamptz, p_minutes integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ends timestamptz;
  v_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  if not public.is_platform_admin() then
    return jsonb_build_object('error', 'Solo un admin puede publicar horarios', 'code', 'forbidden');
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    return jsonb_build_object('error', 'Elegí un horario futuro', 'code', 'invalid_slot');
  end if;

  if p_minutes is null or p_minutes < 15 or p_minutes > 180 then
    return jsonb_build_object('error', 'Duración inválida', 'code', 'invalid_slot');
  end if;

  v_ends := p_starts_at + make_interval(mins => p_minutes);

  insert into public.interview_slots (starts_at, ends_at, interviewer_id)
  values (p_starts_at, v_ends, v_uid)
  returning id into v_id;

  return jsonb_build_object('success', true, 'id', v_id);
exception
  when unique_violation then
    return jsonb_build_object('error', 'Ese horario ya está publicado', 'code', 'conflict');
end;
$$;

-- --- book slot (applicant, own request) ---

create or replace function public.book_interview_slot(p_slot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_starts timestamptz;
  v_request_id uuid;
  v_estado public.membership_request_estado;
  v_booking_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'No autorizado', 'code', 'forbidden');
  end if;

  select starts_at into v_starts
  from public.interview_slots
  where id = p_slot_id
  for update;

  if not found then
    return jsonb_build_object('error', 'Ese horario no existe', 'code', 'not_found');
  end if;

  if v_starts <= now() then
    return jsonb_build_object('error', 'Ese horario ya pasó', 'code', 'invalid_slot');
  end if;

  select id, estado
  into v_request_id, v_estado
  from public.membership_requests
  where profile_id = v_uid
    and estado not in ('aprobado', 'cerrada')
  for update;

  if not found then
    return jsonb_build_object('error', 'Enviá la solicitud antes de reservar', 'code', 'not_found');
  end if;

  if v_estado not in ('pendiente_coordinacion', 'entrevista_solicitada', 'reprogramacion') then
    return jsonb_build_object('error', 'Ya no podés cambiar el horario', 'code', 'invalid_transition');
  end if;

  insert into public.interview_bookings (slot_id, request_id, profile_id)
  values (p_slot_id, v_request_id, v_uid)
  returning id into v_booking_id;

  return jsonb_build_object('success', true, 'id', v_booking_id, 'request_id', v_request_id);
exception
  when unique_violation then
    if sqlerrm ilike '%request_id%' then
      return jsonb_build_object('error', 'Ya reservaste un horario', 'code', 'conflict');
    end if;
    return jsonb_build_object(
      'error', 'Ese horario acaba de ocuparse. Elegí otro.',
      'code', 'conflict'
    );
end;
$$;

revoke execute on function public.create_interview_slot(timestamptz, integer) from public, anon;
grant execute on function public.create_interview_slot(timestamptz, integer) to authenticated;

revoke execute on function public.book_interview_slot(uuid) from public, anon;
grant execute on function public.book_interview_slot(uuid) to authenticated;
