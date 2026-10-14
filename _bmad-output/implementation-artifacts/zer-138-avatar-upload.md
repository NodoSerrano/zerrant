# Story ZER-138: Mejorar la carga de foto de perfil

Status: review

Linear: https://linear.app/zerrant/issue/ZER-138 · parent ZER-125 · High · Improvement / ux-debt
Rama: `agumarchetti/zer-138-mejorar-la-carga-de-foto-de-perfil`

## Story

Como persona que se suma a Nodo Serrano,
quiero cargar mi foto de perfil subiendo un archivo o sacándola con la cámara, sin que el flujo se trabe,
para que el resto de la comunidad me pueda reconocer.

## Acceptance Criteria

1. **Given** un archivo de imagen válido (JPG/PNG/WebP/HEIC), **when** se sube, **then** queda persistido (`profiles.avatar_url` + objeto en `avatars/<uid>/`) y se ve en el paso. Esto incluye fotos de cámara de celular de más de 5 MB: se achican en el cliente antes de mandarse.
2. **Given** un dispositivo con cámara, **when** el usuario elige "Sacar foto", **then** se abre la cámara (`<input capture="user">`) y la foto se usa por el mismo pipeline. "Subir foto" (galería/archivos, sin `capture`) está siempre disponible: la cámara nunca es el único camino.
3. Un fallo de upload muestra un error **específico** (tamaño, formato, guardado o conexión) y el botón vuelve a quedar usable. Nunca queda en "Subiendo..." ni muestra "Revisá tu conexión" por un archivo demasiado grande.
4. El archivo no es público más allá de la política de avatares: se puede leer por su URL pública (UUID no adivinable), pero **ningún rol puede listar** el bucket para enumerar los avatares y los `user_id` de otros. El tipo (por magic bytes) y el tamaño (≤ 5 MB) se validan **en server**.
5. Copy del paso: "Necesitamos una foto clara para poder reconocerte".
6. La foto sigue siendo **opcional** en el onboarding (decisión de producto, 2026-10-03): "Guardar y continuar" funciona sin foto.

## Diagnóstico (causa raíz)

- `validateAvatarFile` corta en 5 MB y `serverActions.bodySizeLimit` en 6 MB (`next.config.ts`). El cliente no achica ni pre-valida, así que una foto típica de cámara (4–12 MB) falla siempre:
  - 5–6 MB: el server la rechaza con "no puede superar los 5 MB" (el usuario no tiene cómo resolverlo desde el celular).
  - más de 6 MB: Next corta el request antes de la action, la promesa rechaza y `useGuardedActionState` muestra `TRANSPORT_ERROR` ("No pudimos conectar…"). Es engañoso y se percibe como un bloqueo. **Evidencia:** test RED en `src/components/AvatarPicker.test.tsx` (task 1).
- Policy `"Avatar images are publicly readable"` (`supabase/migrations/20260725002350_avatars_storage.sql`): `select` sobre `storage.objects` para cualquier rol, incluido `anon`. En un bucket `public = true` el endpoint `/object/public/` no necesita esa policy; con ella, `storage.from('avatars').list()` enumera todas las carpetas `<user_id>/`.

## Tasks / Subtasks

- [ ] **T1 — Evidencia RED (orquestador)** (AC 3)
  - [ ] Test en `AvatarPicker.test.tsx`: un archivo de más de 6 MB que no se puede achicar no llega a la action y muestra "La imagen no puede superar los 5 MB", no `TRANSPORT_ERROR`. Hoy falla.
- [ ] **T2 — Validación server (orquestador, TDD)** (AC 4)
  - [ ] Tests de límite en `avatar.test.ts`: exactamente 5 MB pasa, 5 MB + 1 byte falla, tipo declarado inválido falla.
  - [ ] Tests en `actions.test.ts`: el mime declarado miente (bytes no imagen), así que no se sube a Storage. El archivo convertido/achicado también respeta ≤ 5 MB después de `ensureWebSafeImage`.
  - [ ] Ajustar solo si algún test sale RED (el pipeline actual ya valida tipo/tamaño/sniff).
- [ ] **T3 — Policies (orquestador, migración nueva)** (AC 4)
  - [ ] Migración nueva `supabase/migrations/<ts>_zer138_avatars_no_listing.sql`: `drop policy "Avatar images are publicly readable"`. No se edita la migración existente.
  - [ ] Tests DB `supabase/tests/avatars-storage.db.test.ts`: anon y otro usuario no pueden listar `avatars`, la URL pública de un objeto sigue respondiendo 200, el dueño sube/borra en su carpeta y no puede subir en la carpeta de otro.
  - [ ] Infra DB tests: `vitest.db.config.ts`, el `exclude` de `vitest.config.ts` y el step de CI traídos **exactamente idénticos** a los de PR #107 (ZER-143, commit `b610080`), **sin renombrar el step**: ya corre `supabase/tests/**/*.db.test.ts`, así que levanta el test de avatares. Renombrarlo generaría conflicto con #107.
  - [ ] Verificar que `avatarPathFromPublicUrl` y el borrado del avatar previo siguen funcionando sin la policy select (el `remove` del dueño usa la policy delete).
- [ ] **T4 — Diseño (orquestador, Pencil)** (AC 2, 5)
  - [ ] Frame del onboarding step1 en `design/nodo-serrano.pen`: dos acciones (Subir foto / Sacar foto), copy y estados de subida y error. Screenshot y aprobación antes de codear UI.
- [ ] **T5 — UI (implementador)** (AC 1, 2, 3, 5)
  - [ ] `src/features/profile/avatar-resize.ts` (+ test): achica en cliente con `createImageBitmap` + canvas a un lado máximo de 1024 px, JPEG q≈0.85. Si el browser no decodifica (HEIC en Chrome/Android), devuelve el original.
  - [ ] `AvatarPicker`: si el archivo final supera 5 MB, error local sin llamar a la action. Dos botones según el frame. El "Sacar foto" usa un input con `capture="user"`, y el de upload no lleva `capture`. Mantener los tests existentes (a11y, foco, placeholder, error conserva foto previa, bloqueo en vuelo).
  - [ ] `Step1Form`: copy de AC 5. `EditProfileForm` hereda el picker sin romper.
- [ ] **T6 — Gates + review** (todos)
  - [ ] `vitest run --dir src`, `vitest run -c vitest.db.config.ts`, `tsc --noEmit`, `oxlint --quiet`, `oxfmt --check`.
  - [ ] Review adversarial (Codex) centrado en storage policies, validación server y acceso a avatares ajenos.
  - [ ] Verificación visual a 375 px (Agustín).

## Dev Notes

### Estado actual (preservar)

- `src/features/profile/actions.ts` `uploadAvatar`: auth, `validateAvatarFile`, `sniffImageType` sobre bytes, `ensureWebSafeImage` (HEIC→JPEG con `heic-convert`), path `<uid>/<uuid>.<ext>`, `upsert:false`, update `profiles.avatar_url`, rollback del objeto si falla la DB, borra el avatar previo y `revalidatePath("/", "layout")`.
- `src/components/AvatarPicker.tsx`: usado en onboarding step1 y en `profile/edit`. Guarda la URL en estado propio, de modo que un error posterior no borra la foto ya guardada. Avisa `onUploadingChange` para que Step1Form deshabilite el submit. Usa `useGuardedActionState` (lock de doble submit, transport → `{error}`).
- Bucket `avatars`: `public=true`, `file_size_limit=5MiB`, `allowed_mime_types=[jpeg,png,webp]`. Policies insert/update/delete restringidas a `(storage.foldername(name))[1] = auth.uid()`.
- `next.config.ts`: `bodySizeLimit: "6mb"`. No se sube: el fix es achicar en cliente.

### Guardrails

- El implementador **no toca** migraciones, policies, `actions.ts` ni `avatar.ts`, y **no commitea**.
- No duplicar lógica de validación: el cliente reusa `AVATAR_MAX_BYTES` / `AVATAR_ACCEPTED_TYPES` de `avatar.ts`.
- `capture` es una pista: en desktop se ignora y abre el selector de archivos, lo que cumple "si no hay cámara, el upload sigue disponible". No hace falta detectar la cámara con `getUserMedia`.
- Out of scope: foto obligatoria, moderación automática.

### Testing

- Unit: Vitest + Testing Library (jsdom). `createImageBitmap`/canvas se mockean en el test del resize.
- DB: `supabase/tests/*.db.test.ts` contra Supabase local (`supabase start`), patrón de `membership-request-states.db.test.ts` (ZER-143).

### References

- `supabase/migrations/20260725002350_avatars_storage.sql`
- `src/features/profile/{actions.ts,avatar.ts,avatar-convert.ts}`
- `src/components/AvatarPicker.tsx`, `src/app/(onboarding)/onboarding/step1/Step1Form.tsx`, `src/app/(modal)/profile/edit/EditProfileForm.tsx`
- `src/lib/use-guarded-action-state.ts`, `next.config.ts`
- `docs/roadmap/Seguridad RLS.md`, `docs/roadmap/Modelo de datos.md`
- Shared Avatar: ZER-68 (`src/components/Avatar.tsx`)

## Dev Agent Record

### Agent Model Used

- Orquestador (seguridad, migración, tests de server/DB, diseño): Claude Opus 5.5
- Implementador (UI, resize, copy): Claude Sonnet 5.5
- Revisor adversarial: Codex GPT-6 Luna

### Completion Notes List

- Causa raíz: fotos de cámara sin achicar. Entre 5 y 6 MB las rechazaba el server; arriba de 6 MB Next cortaba la server action y aparecía el error de conexión. Evidencia: test RED en `AvatarPicker.test.tsx`.
- Achicado en el cliente (1024 px, JPEG sobre blanco) y rechazo local de lo que sigue superando 5 MB.
- Botones "Subir foto" / "Sacar foto" (`capture="user"`), touch target de 44 px. Copy en step1 y foto opcional.
- Server: tamaño revalidado tras convertir HEIC; borrado del avatar previo limitado a `<uid>/`.
- Storage: migración `20261003150000_zer138_avatars_no_listing.sql`; el bucket ya no se puede listar. 8 tests contra la DB local.
- Gates: vitest src 161/1494, DB 8/8, tsc, oxlint, oxfmt. Verificación visual a 375 px OK (Agustín). Falta probar la cámara en un dispositivo real.
- Diferidos: ZER-179 (escritura directa a Storage) y memoria del decode.

### File List

- supabase/migrations/20261003150000_zer138_avatars_no_listing.sql (nuevo)
- supabase/tests/avatars-storage.db.test.ts (nuevo)
- vitest.db.config.ts, vitest.config.ts, .github/workflows/ci.yml (idénticos a #107)
- src/features/profile/avatar.ts, actions.ts, actions.test.ts
- src/features/profile/avatar-resize.ts, avatar-resize.test.ts (nuevos)
- src/components/AvatarPicker.tsx, AvatarPicker.test.tsx
- src/app/(onboarding)/onboarding/step1/Step1Form.tsx
- src/features/profile/**tests**/step1-form.test.tsx, step1-page.test.tsx, edit-profile-page.test.tsx
- design/nodo-serrano.pen (commit aparte)

## Review (Codex, 2026-10-04) — triage aprobado

- **Aplicado:** el borrado del avatar previo se limita a la carpeta `<user.id>/` del usuario, sin importar lo que diga `avatar_url` (`actions.ts`, con test).
- **Aplicado:** el achicado pinta un fondo blanco antes de exportar a JPEG, porque si no los PNG transparentes quedaban con fondo negro (`avatar-resize.ts`, con test).
- **Diferido → [ZER-179](https://linear.app/zerrant/issue/ZER-179):** un cliente autenticado puede subir directo a Storage en su carpeta, salteando la validación por magic bytes del server (y sobrescribir con `upsert:true`). Hay que decidir si solo el server escribe en el bucket.
- **Diferido:** uso alto de memoria al decodificar fotos enormes en `shrinkAvatarImage`. Si falla, se usa el original y el límite local responde, así que la UI no se cuelga.
- **Descartado:** validar el formato UUID en `avatarObjectPath`. El uid siempre viene de `auth.getUser()`.
