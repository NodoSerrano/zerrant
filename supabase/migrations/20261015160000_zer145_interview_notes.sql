-- ZER-145: internal interview notes.
--
-- Separate from membership_requests so the applicant's SELECT policies and
-- column grants cannot return them. Authenticated may SELECT; RLS returns
-- rows only to platform admins. Writes go through upsert_interview_note().
--
-- REVERSE (manual, run as postgres):
--   drop function public.upsert_interview_note(text, uuid, uuid);
--   drop table public.interview_notes;

create table public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.membership_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_interview_notes_request_created
  on public.interview_notes (request_id, created_at);

alter table public.interview_notes enable row level security;

create policy "Admins can read interview notes"
  on public.interview_notes
  for select
  to authenticated
  using (public.is_platform_admin());

-- Default privileges grant table DML to anon/authenticated. Notes are not
-- writable that way: the RPC is the only insert/update path. No delete.
revoke all on public.interview_notes from anon, authenticated;
grant select on public.interview_notes to authenticated;

create or replace function public.upsert_interview_note(
  p_body text,
  p_request_id uuid default null,
  p_note_id uuid default null
)
returns public.interview_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_row public.interview_notes;
begin
  if v_uid is null or not public.is_platform_admin() then
    raise exception 'Solo un admin puede gestionar solicitudes'
      using errcode = '42501';
  end if;

  if char_length(v_body) < 1 then
    raise exception 'La nota no puede estar vacía'
      using errcode = 'check_violation';
  end if;

  if char_length(v_body) > 2000 then
    raise exception 'La nota es demasiado larga'
      using errcode = 'check_violation';
  end if;

  if p_note_id is null then
    if p_request_id is null or not exists (
      select 1 from public.membership_requests where id = p_request_id
    ) then
      raise exception 'Solicitud no encontrada'
        using errcode = 'no_data_found';
    end if;

    insert into public.interview_notes (request_id, author_id, body)
    values (p_request_id, v_uid, v_body)
    returning * into v_row;

    return v_row;
  end if;

  update public.interview_notes
  set body = v_body,
      updated_at = now()
  where id = p_note_id
    and author_id = v_uid
  returning * into v_row;

  if not found then
    raise exception 'No podés editar esta nota'
      using errcode = '42501';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.upsert_interview_note(text, uuid, uuid) from public, anon;
grant execute on function public.upsert_interview_note(text, uuid, uuid) to authenticated;
