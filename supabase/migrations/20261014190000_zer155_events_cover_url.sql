-- Optional https cover for an event. Null means the event has no image.

alter table public.events
  add column cover_url text;

grant insert (cover_url) on public.events to authenticated;
grant update (cover_url) on public.events to authenticated;
