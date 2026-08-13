create unique index if not exists membership_requests_one_pending_per_profile
  on public.membership_requests (profile_id)
  where estado = 'pendiente';
