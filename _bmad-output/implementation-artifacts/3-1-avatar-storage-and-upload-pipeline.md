---
baseline_commit: c232a68b5a791c134614f3fd198757764e15535c
---

# Story 3.1: Avatar storage and upload pipeline

Status: review

<!-- Story context engine — from epics.md, SPEC.md, Linear ZER-12, and current code. No Pencil frame: infraestructura. -->

## Story

As a member,
I want to upload a real profile photo to storage,
so that my avatar persists in production (not a fake control).

## Acceptance Criteria

1. **Given** Supabase Storage como backend de avatares
   **When** se aplica la migración
   **Then** existe el bucket `avatars` público, con `file_size_limit` 5 MiB y `allowed_mime_types` `image/jpeg,image/png,image/webp`
   **And** `storage.objects` tiene 4 políticas: SELECT público, e INSERT/UPDATE/DELETE limitados a `authenticated` cuya carpeta raíz sea `auth.uid()`
   **(NFR9)**

2. **Given** un usuario autenticado
   **When** sube una imagen válida vía `uploadAvatar`
   **Then** el objeto queda en `avatars/<user_id>/<uuid>.<ext>` y `profiles.avatar_url` guarda su URL pública
   **And** la action devuelve `{ avatarUrl }` (no redirige, para que ZER-13/ZER-17 puedan mostrar preview)
   **(FR17, FR21)**

3. **Given** un archivo inválido
   **When** se intenta subir
   **Then** se rechaza con un error claro en español y **sin tocar Storage**:
   - sin archivo o vacío → "Seleccioná una imagen"
   - mime no aceptado → "Formato no permitido. Usá JPG, PNG, WebP o HEIC"
   - > 5 MiB → "La imagen no puede superar los 5 MB"
   - bytes que no son una imagen (ej. ejecutable renombrado `.png`) → "El archivo no es una imagen válida"
     **(NFR9)**

4. **Given** una foto HEIC de iPhone
   **When** se sube
   **Then** se convierte a JPEG en el server antes de llegar a Storage
   **And** si libheif no puede decodificarla → "No pudimos procesar la imagen HEIC. Probá con JPG o PNG"
   **(FR17)**

5. **Given** un fallo parcial
   **When** el upload sale bien pero el update de `profiles` falla
   **Then** el objeto recién subido se borra (no quedan huérfanos)
   **And** cuando el reemplazo sale bien, el avatar anterior se borra de Storage — sólo si vivía en nuestro bucket
   **(NFR9)**

6. **Given** TDD obligatorio
   **When** se implementa
   **Then** cada helper y cada rama de la action tiene test que falló primero
   **And** `pnpm test`, `pnpm typecheck` y `pnpm lint` pasan
   **(NFR1, NFR2, NFR6)**

7. Out of scope
   - UI del control de foto (onboarding step 1 → ZER-13, editar perfil → ZER-17)
   - Redimensionado/compresión client-side → ZER-13
   - `supabase db push` a producción → lo ejecuta el owner del proyecto

## Tasks / Subtasks

- [x] **T1 — Red: tests de helpers puros** (AC: 3)
  - [x] `avatar.test.ts`: validación (mime, tamaño, ausencia), sniff por magic numbers, generación de path, parseo de URL pública
  - [x] Verificado RED: módulo `./avatar` inexistente
- [x] **T2 — Green: `src/features/profile/avatar.ts`** (AC: 3)
  - [x] `validateAvatarFile`, `sniffImageType`, `avatarObjectPath`, `avatarPathFromPublicUrl`
  - [x] Fix tras RED: el guard de longitud mínima era 12 bytes y tapaba JPEG (3) y PNG (8)
- [x] **T2b — Red→Green: conversión HEIC** (AC: 4)
  - [x] `avatar-convert.test.ts` con `heic-convert` mockeado
  - [x] `ensureWebSafeImage` — passthrough para jpeg/png/webp, HEIC → JPEG q0.9
- [x] **T3 — Red: tests de `uploadAvatar`** (AC: 2, 3, 4, 5)
  - [x] Mock de `@/lib/supabase/server` extendido con `storage.from()` y `from().select().eq().single()`
  - [x] Verificado RED: 11 fallos por `uploadAvatar is not a function`, 8 tests previos intactos
- [x] **T4 — Green: `uploadAvatar` en `actions.ts`** (AC: 2, 4, 5)
  - [x] Fix tras RED: `revalidatePath` requiere el store de Next → mock de `next/cache` en el test
- [x] **T5 — Migración + config local** (AC: 1)
  - [x] `20260725002350_avatars_storage.sql`, bloque `[storage.buckets.avatars]` en `config.toml`
- [x] **T6 — `next.config.ts`: `images.remotePatterns`** (AC: 2)
- [x] **T7 — Verify**
  - [x] `pnpm test` 199/199, `pnpm typecheck`, `pnpm lint`
  - [x] Migración aplicada en Supabase local: bucket y 4 políticas confirmadas en `pg_policies`
  - [x] RLS probado con dos usuarios reales — ver "Verificación contra Supabase local"
  - [x] Conversión HEIC probada con un archivo real (`avatar-heic.integration.test.ts`)
  - [ ] `supabase db push` a prod (decisión del owner)

## Verificación contra Supabase local

`supabase start` + `psql` confirman que la migración aplica limpia:

```
20260725002350 | avatars_storage        -- en schema_migrations
avatars | public=t | 5242880 | {image/jpeg,image/png,image/webp}
4 políticas: SELECT {public}, INSERT/UPDATE/DELETE {authenticated}
```

Prueba de RLS con dos usuarios reales creados vía admin API (lo que los mocks no pueden cubrir):

| #   | Caso                        | Esperado | Resultado                                           |
| --- | --------------------------- | -------- | --------------------------------------------------- |
| 1   | A sube a `A/propio.png`     | 200      | ✅ 200                                              |
| 2   | A sube a `B/robado.png`     | 4xx      | ✅ 403 `new row violates row-level security policy` |
| 3   | A sube a la raíz del bucket | 4xx      | ✅ 403                                              |
| 4   | Anónimo sube a `A/`         | 4xx      | ✅ 403                                              |
| 5   | Lectura pública sin token   | 200      | ✅ 200, 67 bytes                                    |
| 6   | Subir un PDF                | 4xx      | ✅ 415 `mime type application/pdf is not supported` |

El caso 3 importa: sin carpeta, `(storage.foldername(name))[1]` no coincide con ningún `auth.uid()`, así que la política deniega — no hay forma de dejar objetos sueltos fuera del scope de un usuario.

## Dev Notes

### Por qué la action no redirige

Las tres actions previas de `src/features/profile/actions.ts` terminan en `redirect()`. `uploadAvatar` no: devuelve `{ avatarUrl }` porque ZER-13 (onboarding paso 1) y ZER-17 (editar perfil) necesitan pintar el preview sin navegar. La firma `(_prevState, formData)` se mantiene, así que sigue siendo compatible con `useActionState`.

### Por qué se hace sniffing de bytes

`file.type` lo declara el browser y se falsifica trivialmente. `validateAvatarFile` filtra lo declarado (barato, corta temprano) y `sniffImageType` verifica los magic numbers reales antes de tocar Storage. El bucket además repite los límites de tamaño/mime: defensa en profundidad, por si alguien sube con el SDK directo.

### Por qué HEIC se convierte en vez de guardarse

HEIC solo lo renderiza Safari. Guardarlo crudo dejaría el avatar roto en Chrome, Firefox y Android, y `next/image` tampoco lo optimiza. Se acepta en el input y se convierte a JPEG con `heic-convert` (JS puro sobre libheif — sin binarios nativos, no necesita `sharp`). Por eso el bucket **no** lista HEIC en `allowed_mime_types`: nunca debería llegar uno.

### Sin service-role

El cliente de `@/lib/supabase/server` ya es user-scoped. La autorización la dan las políticas de `storage.objects` sobre la carpeta `<user_id>/`, no una key privilegiada. No se agregó `SUPABASE_SERVICE_ROLE_KEY` al proyecto.

### Files to touch

| Acción     | Archivo                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| NEW        | `src/features/profile/avatar.ts`                                          |
| NEW        | `src/features/profile/avatar.test.ts` (35 tests)                          |
| NEW        | `src/features/profile/avatar-convert.ts`                                  |
| NEW        | `src/features/profile/avatar-convert.test.ts` (5 tests)                   |
| NEW        | `supabase/migrations/20260725002350_avatars_storage.sql`                  |
| UPDATE     | `src/features/profile/actions.ts` (+`uploadAvatar`, +`AvatarUploadState`) |
| UPDATE     | `src/features/profile/actions.test.ts` (mock extendido + 11 tests)        |
| UPDATE     | `supabase/config.toml` (`[storage.buckets.avatars]`)                      |
| UPDATE     | `next.config.ts` (`images.remotePatterns`)                                |
| UPDATE     | `package.json` (`heic-convert`, `@types/heic-convert`)                    |
| KEEP verde | `src/components/Avatar.tsx`, resto de `src/features/profile/*`            |

`src/lib/supabase/database.types.ts` no se regenera: `avatar_url` ya existía.

### Testing strategy

Tres niveles, cada uno con su RED previo:

1. **Helpers puros** (`avatar.test.ts`) — sin mocks, bytes reales construidos a mano.
2. **Conversión** (`avatar-convert.test.ts`) — `heic-convert` mockeado; se verifica que el passthrough no lo invoque y que HEIC sí.
3. **Action** (`actions.test.ts`) — Supabase mockeado siguiendo el patrón `vi.hoisted` ya existente en el repo; `ensureWebSafeImage` mockeada porque tiene su propio test.
4. **Integración HEIC** (`avatar-heic.integration.test.ts`) — sin mocks: corre libheif de verdad sobre `__fixtures__/sample.heic` y verifica que la salida tenga firma JPEG. Es lo único que prueba que la foto de un iPhone termine siendo usable.

Lo que ni siquiera eso puede probar (bucket real, políticas RLS) se verificó contra Supabase local — ver "Verificación contra Supabase local".

### Grey-box search targets (post-implementation)

Debe devolver CERO:

```bash
grep -rn "SERVICE_ROLE" src/                      # no usamos key privilegiada
# -w es necesario: "todos"/"todo" en los comentarios en español dan falso positivo
grep -rnwE "TODO|FIXME|stub|fake" src/features/profile/
```

Debe estar PRESENTE:

```bash
grep -n "storage.foldername" supabase/migrations/20260725002350_avatars_storage.sql
grep -n "sniffImageType" src/features/profile/actions.ts
grep -n "remotePatterns" next.config.ts
```

### Do NOT

- No crear el bucket a mano por el dashboard — rompe la paridad local/remoto
- No confiar en `file.type` para decidir qué se sube
- No guardar HEIC crudo en Storage
- No agregar service-role key: RLS alcanza
- No tocar el esquema de `profiles`: ya tiene `avatar_url` y sus políticas

### References

- Linear [ZER-12](https://linear.app/zerrant/issue/ZER-12/31-avatar-storage-and-upload-pipeline) — bloquea ZER-13 y ZER-17
- `_bmad-output/planning-artifacts/epics.md` — Story 3.1, FR17/FR21/NFR9
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` — CAP-5, CAP-8
- `supabase/migrations/20260721194312_profiles_setup.sql` — estilo de las políticas RLS

## Dev Agent Record

### Agent Model Used

claude-opus-5

### Debug Log References

- RED #1: `Failed to resolve import "./avatar"` — esperado, módulo inexistente
- Fallo tras GREEN #1: 2 tests de `sniffImageType` (JPEG 6 bytes, PNG 9 bytes) contra un guard de `length < 12`. Se corrigió el código: el guard mínimo pasa a 3 bytes y el de 12 se mueve a las ramas WebP/HEIC, que son las únicas que leen el offset 8.
- RED #2: `Failed to resolve import "server-only"` — no es dep del repo, se quitó el import
- RED #3: 11 fallos `uploadAvatar is not a function`, con los 8 tests previos de `actions.test.ts` en verde
- Fallo tras GREEN #3: `Invariant: static generation store missing in revalidatePath`. Las actions previas lo tapaban con su `try/catch` de redirect; acá aflora porque la action retorna. Se mockeó `next/cache`.

### Completion Notes List

- 199/199 tests (145 antes de la story: +54)
- `pnpm typecheck` y `pnpm lint` limpios
- Migración, bucket y las 4 políticas verificados contra Supabase local; RLS probado con dos usuarios reales (6/6 casos)
- Conversión HEIC probada sin mocks contra un archivo real
- `supabase db push` NO ejecutado — el repo no está linkeado y la decisión es del owner

### Change Log

| Fecha      | Cambio                                                 |
| ---------- | ------------------------------------------------------ |
| 2026-07-24 | Story implementada en `juanpe44/zer-12-avatar-storage` |

### File List

- `src/features/profile/avatar.ts` (new)
- `src/features/profile/avatar.test.ts` (new)
- `src/features/profile/avatar-convert.ts` (new)
- `src/features/profile/avatar-convert.test.ts` (new)
- `src/features/profile/avatar-heic.integration.test.ts` (new)
- `src/features/profile/__fixtures__/sample.heic` (new)
- `supabase/migrations/20260725002350_avatars_storage.sql` (new)
- `src/features/profile/actions.ts` (modified)
- `src/features/profile/actions.test.ts` (modified)
- `supabase/config.toml` (modified)
- `next.config.ts` (modified)
- `package.json` / `pnpm-lock.yaml` (modified)
