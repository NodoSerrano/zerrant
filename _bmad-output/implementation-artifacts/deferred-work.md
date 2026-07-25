# Deferred work

## Deferred from: code review of 3-2-onboarding-step-1-ui-and-photo (2026-07-25)

- `updateProfile` y `saveOnboardingStep2` construyen el update sin trim y sin la guarda de `nombre_visible` que se agregó en `saveOnboardingStep1`. Si un form deja de mandar el campo, se manda `null` a una columna NOT NULL. Pre-existente. [`src/features/profile/actions.ts:203`]
- El perfil se consulta dos veces por navegación al onboarding (proxy + server component) y el gate agrega una query a cada request protegido, incluidos los prefetch de `<Link>`. Optimización pendiente (cachear por request o mover el gate a un layout). [`src/proxy.ts:66`]
- La migración de grants arregla `profiles` y `tasks` pero no evita la recurrencia: la próxima tabla nace sin privilegios para `authenticated` y vuelve el `42501`. Falta `alter default privileges` o un chequeo automatizado. [`supabase/migrations/20260725033000_grants_authenticated.sql`]
- El prefill del paso 1 descarta el error de `.single()`: si la lectura falla, el usuario ve el formulario vacío sin explicación y reescribe datos que ya existen. [`src/app/(app)/onboarding/step1/page.tsx:14`]
- Con el onboarding ya cerrado, un POST de server action desde una pestaña vieja parada en `/onboarding` recibe un 307 a `/` (que preserva método y body) en vez de un mensaje. [`src/proxy.ts:82`]
- `next/image` lanza si `profiles.avatar_url` apunta a un host que no está en `remotePatterns` (cambio de proyecto Supabase, dato migrado, build sin `NEXT_PUBLIC_SUPABASE_URL`). Rompe el render de la pantalla que el gate obliga a completar. [`src/components/AvatarPicker.tsx:51`]
