-- ZER-65: `/solicitar` could never insert a membership request.
--
-- The INSERT policy from `20260728190000_membership_roles.sql` guarded
-- `membership_requests` with a `not exists` subquery over `membership_requests`
-- itself. Evaluating the policy re-triggered the policies on the same table, so
-- every insert aborted with:
--
--   42P17 infinite recursion detected in policy for relation "membership_requests"
--
-- The app mapped that to a generic "No pudimos enviar tu solicitud", so the whole
-- tourist -> serrano path was dead for every user, not just some.
--
-- Fix: drop the self-referencing clause. "One pending request per profile" is a
-- data-integrity rule, not an access-control rule, and it is already enforced
-- atomically by the partial unique index from
-- `20260813210000_membership_requests_one_pending.sql`:
--
--   membership_requests_one_pending_per_profile on (profile_id) where estado = 'pendiente'
--
-- The index is also the stronger guarantee: a WITH CHECK subquery cannot stop two
-- concurrent transactions from both passing the check. The remaining policy
-- clauses keep the access-control part intact (own row only, tourist only), and
-- `createMembershipRequest` maps the resulting 23505 to the pending message.

drop policy if exists "Tourists can create one membership request at a time"
  on public.membership_requests;

create policy "Tourists can create their own membership request"
  on public.membership_requests
  for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'tourist'
    )
  );
