-- ZER-117: project_members needs created_at for the join-request queue.
-- The requests page selects + orders by created_at. Without the column, PostgREST
-- rejects the query and the admin UI collapses to an empty queue (0 pendientes)
-- even when pendiente rows exist.

alter table public.project_members
  add column if not exists created_at timestamptz not null default now();
