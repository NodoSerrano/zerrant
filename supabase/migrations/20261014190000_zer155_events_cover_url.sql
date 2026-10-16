-- Optional https cover for an event. Null means the event has no image.

alter table public.events
  add column cover_url text;

alter table public.events
  add constraint events_cover_url_https
  check (cover_url is null or cover_url like 'https://%');

grant insert (cover_url) on public.events to authenticated;
grant update (cover_url) on public.events to authenticated;
