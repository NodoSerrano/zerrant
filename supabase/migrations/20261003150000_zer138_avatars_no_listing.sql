-- ZER-138: el bucket de avatares deja de ser listable.
--
-- El bucket es `public = true`, así que /storage/v1/object/public/avatars/...
-- sirve cada avatar por su URL sin pasar por RLS. La policy de select abierta
-- no hacía falta para eso y, en cambio, permitía a cualquiera (incluso anon)
-- listar el bucket y enumerar los `<user_id>/` y los avatares de todos.
--
-- El dueño conserva select sobre su propia carpeta: Storage lo necesita para
-- listar y borrar sus objetos (el delete con RLS también evalúa select).

drop policy if exists "Avatar images are publicly readable" on storage.objects;

create policy "Users can read own avatar objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
