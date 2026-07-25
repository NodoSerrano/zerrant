-- Las tablas se crearon sin privilegios para los roles de PostgREST: `anon` y
-- `authenticated` sólo heredaron TRIGGER/REFERENCES/TRUNCATE, así que cualquier
-- select/insert/update del usuario moría con 42501 "permission denied for table"
-- antes de que RLS llegara a evaluarse.
--
-- Los grants se limitan a lo que las políticas ya permiten: `authenticated` con
-- select/insert/update, sin delete (ninguna política lo habilita) y sin nada para
-- `anon` (no hay política que le dé acceso a estas tablas).

grant select, insert, update on public.profiles to authenticated;

grant select, insert, update on public.tasks to authenticated;
