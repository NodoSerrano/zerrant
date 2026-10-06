-- ZER-146: final "convertir en miembro" stays on transition_membership_request.
--
-- ZER-143 already grants profiles.tier (capped to tier_solicitado = standard)
-- in the same transaction as entrevista_realizada → aprobado, and the history
-- trigger records actor (auth.uid()) and created_at. This migration only adds
-- the missing gate: the applicant cannot approve their own request, even if
-- they are a platform admin. Earlier states stay illegal via
-- membership_request_transitions. No second tier write.

create or replace function public.membership_requests_block_self_approve()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.estado = 'aprobado'
     and old.estado is distinct from 'aprobado'
     and new.profile_id = auth.uid()
  then
    raise exception 'No podés aprobar tu propia solicitud'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists membership_requests_block_self_approve on public.membership_requests;

create trigger membership_requests_block_self_approve
  before update of estado on public.membership_requests
  for each row
  execute function public.membership_requests_block_self_approve();

revoke execute on function public.membership_requests_block_self_approve()
  from public, anon, authenticated;
