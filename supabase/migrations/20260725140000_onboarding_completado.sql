-- Marca explícita de onboarding terminado.
--
-- Inferirlo de los campos del paso 1 no alcanza: apenas se guardaba el paso 1 el
-- gate daba el onboarding por cerrado y el paso 2 quedaba inalcanzable. El paso 2
-- tiene todos sus campos opcionales, así que no hay dato del que inferir haberlo
-- pasado: hace falta la marca.

alter table public.profiles
  add column onboarding_completado_en timestamptz;

-- Los perfiles que ya tenían los datos del paso 1 no vuelven al onboarding.
update public.profiles
set onboarding_completado_en = now()
where nombre is not null
  and apellido is not null
  and fecha_nacimiento is not null;
