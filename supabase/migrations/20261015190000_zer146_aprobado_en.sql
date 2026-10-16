-- ZER-146 review: the 7-day confirmation keys off the conversion instant,
-- not membership_requests.actualizado_en. A later update of an aprobado
-- row must not restart the banner on Inicio and perfil.
--
-- No second profiles.tier write. The stamp only sets NEW.aprobado_en when
-- estado enters aprobado.

alter table public.membership_requests
  add column aprobado_en timestamptz;

comment on column public.membership_requests.aprobado_en is
  'Set when estado enters aprobado. Later updates of the row do not move it.';

update public.membership_requests as mr
set aprobado_en = ev.first_approved
from (
  select request_id, min(created_at) as first_approved
  from public.membership_request_events
  where to_estado = 'aprobado'
  group by request_id
) as ev
where mr.id = ev.request_id;

update public.membership_requests
set aprobado_en = actualizado_en
where estado = 'aprobado'
  and aprobado_en is null;

create or replace function public.membership_requests_stamp_aprobado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.estado = 'aprobado'
     and old.estado is distinct from 'aprobado'
  then
    new.aprobado_en := now();
  end if;
  return new;
end;
$$;

drop trigger if exists membership_requests_stamp_aprobado_en on public.membership_requests;

create trigger membership_requests_stamp_aprobado_en
  before update of estado on public.membership_requests
  for each row
  execute function public.membership_requests_stamp_aprobado_en();

revoke execute on function public.membership_requests_stamp_aprobado_en()
  from public, anon, authenticated;
