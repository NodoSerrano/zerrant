-- ZER-23 — review de PR #6 (ZER-13).
--
-- `20260725160000_grants_por_columna.sql` dejó `id` dentro del grant de INSERT de
-- `profiles`. La columna no hace falta ahí: la fila la crea el trigger
-- `handle_new_user` (`security definer`), que setea `id` con el `new.id` de
-- `auth.users`. Dejarla en el grant es superficie de ataque: un insert que
-- esquivara el trigger podría elegir un UUID arbitrario.

revoke insert (id) on public.profiles from authenticated;
