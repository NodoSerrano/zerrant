-- Los grants de `20260725033000_grants_authenticated.sql` eran a nivel tabla, y las
-- políticas de RLS sólo filtran filas, no columnas: con su propio token, un usuario
-- podía hacer PATCH a su fila de `profiles` y setearse `is_platform_admin` o `tier`.
-- `docs/roadmap/Seguridad RLS.md` dice que esas dos columnas sólo las cambia un admin.
--
-- Se reemplazan por grants por columna: quedan afuera `id`, `email`, `tier`,
-- `is_platform_admin`, `aprobado_en` y `created_at`.

revoke insert, update on public.profiles from authenticated;

grant insert (
  id,
  nombre,
  apellido,
  apodo,
  nombre_visible,
  avatar_url,
  fecha_nacimiento,
  bio,
  contacto_telegram,
  sitio_url,
  disponibilidad,
  tarifa_hora,
  visibilidad_tarifa,
  onboarding_completado_en
) on public.profiles to authenticated;

grant update (
  nombre,
  apellido,
  apodo,
  nombre_visible,
  avatar_url,
  fecha_nacimiento,
  bio,
  contacto_telegram,
  sitio_url,
  disponibilidad,
  tarifa_hora,
  visibilidad_tarifa,
  onboarding_completado_en
) on public.profiles to authenticated;

-- En `tasks` la política de update deja tocar la fila a quien la creó y a quien la
-- tomó; sin límite de columnas, el que la toma puede reescribir `creado_por`.

revoke insert, update on public.tasks from authenticated;

grant insert (titulo, descripcion, categoria, urgencia, estado, creado_por)
  on public.tasks to authenticated;

grant update (titulo, descripcion, categoria, urgencia, estado, tomada_por)
  on public.tasks to authenticated;
