---
baseline_commit: d734feef9c3462e58974496b325ec8da413c7bfc
---

# Story 3.2: Onboarding paso 1 — UI y foto

Status: review

<!-- Contexto: Linear ZER-13, frame Pencil bvpj5, epics.md Story 3.2, y las decisiones del owner tomadas en la sesión de planning. -->

## Story

Como miembro nuevo,
quiero completar el paso 1 del onboarding con mi foto real,
para que mi perfil arranque con identidad de verdad y no con un formulario genérico.

## Acceptance Criteria

1. **Given** el frame `bvpj5` de Pencil
   **When** se abre `/onboarding/step1`
   **Then** el chrome y el copy coinciden: "Paso 1 de 2" arriba a la derecha, "Creá tu perfil", "Así el resto de la comunidad te conoce."
   **And** no hay control para volver atrás (el onboarding no se saltea)
   **(FR17, UX-DR6)**

2. **Given** los campos de identidad del frame
   **When** se renderiza el formulario
   **Then** son Nombre/"Tu nombre", Apellido/"Tu apellido", Apodo (opcional)/"Cómo te dicen en Nodo" y Fecha de nacimiento
   **And** **no** se pide `nombre_visible` (eso vive en editar perfil, ZER-17)
   **(FR17)**

3. **Given** que nombre, apellido y fecha de nacimiento son obligatorios
   **When** se mira el formulario
   **Then** los tres muestran asterisco en el label y llevan `required`
   **And** el server rechaza igual con "Completá nombre, apellido y fecha de nacimiento" si llegan vacíos
   **(FR17)**

4. **Given** la tubería de avatares de ZER-12
   **When** el usuario elige una foto
   **Then** se sube de verdad vía `uploadAvatar`, se guarda en `avatars/<uid>/` y `profiles.avatar_url` queda apuntando ahí
   **And** el control muestra preview, "Cambiar foto", "Subiendo..." y los errores en español que devuelve la action
   **(FR17, FR21)**

5. **Given** que el onboarding es obligatorio
   **When** el usuario autenticado navega a cualquier ruta protegida sin haber completado el paso 1
   **Then** el proxy lo manda a `/onboarding/step1`
   **And** cuando ya lo completó (`nombre && apellido && fecha_nacimiento`), entrar a `/onboarding` lo saca a `/` — esos datos se editan en `/profile/edit`
   **(FR17)**

6. **Given** TDD obligatorio
   **When** se implementa
   **Then** cada unidad tuvo su test en rojo antes del código
   **And** `pnpm test`, `pnpm typecheck` y `pnpm lint` pasan
   **(NFR1, NFR2, NFR6)**

7. Out of scope
   - Resize/compresión client-side (el canvas no decodifica HEIC fuera de Safari; el server ya convierte y valida ≤5 MB)
   - Ocultar el TabBar durante el onboarding (decisión del owner: se deja)
   - Paso 2 (ZER-14) y editar perfil (ZER-17)

## Tasks / Subtasks

- [x] **T1 — Red→Green: `saveOnboardingStep1`** (AC: 3)
  - [x] RED: 5 fallos (requeridos faltantes, whitespace, y `nombre_visible` omitido)
  - [x] GREEN: validación previa + `update` sin `nombre_visible` cuando el form no lo manda
- [x] **T1b — Red→Green: marca de requerido en `Input`** (AC: 3)
  - [x] El asterisco va fuera del `<label>` para no ensuciar el nombre accesible
- [x] **T2 — Red→Green: `AvatarPicker`** (AC: 4)
  - [x] 7 tests: placeholder, preview, accept, FormData con el file, éxito, error, pending
- [x] **T3 — Red→Green: `Step1Form` + page server** (AC: 1, 2, 3, 4)
  - [x] 9 tests de paridad de copy/labels/required/CTA
  - [x] `page.tsx` pasa a server component y prellena desde `profiles`
- [x] **T4 — Red→Green: gate en `proxy.ts`** (AC: 5)
  - [x] 6 tests nuevos; `/nodo` faltaba en `PROTECTED_PREFIXES` y se agregó
- [x] **T5 — Fix de grants (bloqueante, ver abajo)**
- [x] **T6 — Verify**: 229/229 tests, typecheck, lint, y verificación end-to-end contra Supabase local

## El bug de grants que apareció verificando

La verificación contra Supabase local falló con `42501 permission denied for table profiles`, y no era RLS: las tablas se crearon **sin privilegios** para los roles de PostgREST.

```
grantee       | privilege_type
authenticated | TRIGGER, REFERENCES, TRUNCATE   <- sin SELECT/INSERT/UPDATE
```

Con eso, `profiles` y `tasks` eran inaccesibles para cualquier usuario real: el gate leía `null` (todos quedaban encerrados en el onboarding) y guardar el paso 1 hubiera fallado. Los tests no lo veían porque mockean Supabase.

Fix: `supabase/migrations/20260725033000_grants_authenticated.sql`, con los grants alineados a las políticas existentes (`select, insert, update` para `authenticated`; nada para `anon`, que no tiene ninguna política; sin `delete`, que ninguna política habilita).

## Verificación end-to-end contra Supabase local

Script ad-hoc (usuario real vía `signUp`, cookies de `@supabase/ssr`, fetch contra `next dev`). 23/23:

| Caso                                            | Resultado                             |
| ----------------------------------------------- | ------------------------------------- |
| Incompleto: `/nodo/tasks` y `/profile`          | ✅ 307 → `/onboarding/step1`          |
| step1 con el copy de Pencil                     | ✅ los 7 textos, sin `nombre_visible` |
| step1 sin link de volver                        | ✅                                    |
| Upload a `avatars/<uid>/` con el token del user | ✅ 200, lectura pública 200           |
| `profiles.avatar_url` persistido                | ✅                                    |
| Completo: `/onboarding/step1`                   | ✅ 307 → `/`                          |
| Completo: `/nodo/tasks`                         | ✅ 200                                |
| A medias: prefill de nombre/apellido + preview  | ✅                                    |

Lo único que no cubre: el POST del server action `uploadAvatar` desde el browser (protocolo de server actions). Esa rama está cubierta por los tests unitarios de `AvatarPicker` + `actions.test.ts`, y la tubería de Storage se verificó en ZER-12.

## Dev Notes

### Por qué el picker recibe la action por props

`AvatarPicker` toma `action` como prop en vez de importar `uploadAvatar`. Así el test ejercita el ciclo real de `useActionState` con una action falsa (sin mockear React), y ZER-17 puede reusar el componente con otra action si hiciera falta.

### Por qué no hay `<form>` para la foto

El control vive arriba del form de identidad y dispara `startTransition(() => dispatch(fd))` en el `onChange` del input file. Anidar forms es inválido en HTML y `requestSubmit` en jsdom es innecesario: el FormData se arma a mano con el archivo.

### Por qué `nombre_visible` se volvió opcional en la action

La columna es `not null default 'nombre_apellido'`: mandarle `null` desde un form que ya no tiene el campo la rompía. Ahora sólo se incluye en el `update` si el form la manda (editar perfil sí lo hace).

### Por qué el gate vive en el proxy

Es el único punto por el que pasan todas las rutas, ya tiene test propio y ya hacía un roundtrip a Supabase (`getUser`). Una guarda por layout hubiera dejado agujeros en deep links.

### Files to touch

| Acción | Archivo                                                       |
| ------ | ------------------------------------------------------------- |
| NEW    | `src/components/AvatarPicker.tsx` + `.test.tsx` (7 tests)     |
| NEW    | `src/app/(app)/onboarding/step1/Step1Form.tsx`                |
| NEW    | `src/features/profile/__tests__/step1-form.test.tsx` (9)      |
| NEW    | `supabase/migrations/20260725033000_grants_authenticated.sql` |
| UPDATE | `src/app/(app)/onboarding/step1/page.tsx` (server component)  |
| UPDATE | `src/features/profile/actions.ts` + `actions.test.ts`         |
| UPDATE | `src/components/Input.tsx` + `Input.test.tsx`                 |
| UPDATE | `src/proxy.ts` + `src/proxy.test.ts`                          |

### Do NOT

- No volver a poner un chevron "atrás" en el paso 1: no hay a dónde volver (el proxy rebota `/auth/*` de un usuario logueado)
- No mandar `nombre_visible: null` a `profiles`
- No confiar sólo en `required` del browser: la action valida igual

### References

- Linear [ZER-13](https://linear.app/zerrant/issue/ZER-13/32-onboarding-step-1-ui-and-photo-15), bloqueada por ZER-12 (mergeada en `main`)
- Pencil `design/nodo-serrano.pen`, frame `bvpj5`
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/screen-inventory.md` — fila 1.5

## Dev Agent Record

### Agent Model Used

claude-opus-5

### Debug Log References

- RED T1: 5 fallos en `actions.test.ts` (el `redirect` se disparaba en vez de validar)
- RED T1b: `getByText("*")` sin match
- RED T2/T3: módulos inexistentes
- RED T4: 3 fallos + un cuarto inesperado — `/nodo` no estaba en `PROTECTED_PREFIXES`, así que el gate ni corría ahí
- E2E: `42501 permission denied for table profiles` → migración de grants

### Completion Notes List

- 229/229 tests (199 antes de la story: +30)
- `pnpm typecheck` y `pnpm lint` limpios
- Migración de grants aplicada en local (`supabase migration up --local`) y verificada con un usuario real
- Pendiente del owner: `supabase db push` a prod (incluye la migración de ZER-12 y ésta) y una pasada visual en el browser a 390px contra el frame `bvpj5`

### Change Log

| Fecha      | Cambio                                                         |
| ---------- | -------------------------------------------------------------- |
| 2026-07-25 | Story implementada en `juanpe44/zer-13-onboarding-step1-photo` |

### File List

- `src/components/AvatarPicker.tsx` (new)
- `src/components/AvatarPicker.test.tsx` (new)
- `src/app/(app)/onboarding/step1/Step1Form.tsx` (new)
- `src/features/profile/__tests__/step1-form.test.tsx` (new)
- `supabase/migrations/20260725033000_grants_authenticated.sql` (new)
- `src/app/(app)/onboarding/step1/page.tsx` (modified)
- `src/features/profile/actions.ts` (modified)
- `src/features/profile/actions.test.ts` (modified)
- `src/components/Input.tsx` (modified)
- `src/components/Input.test.tsx` (modified)
- `src/proxy.ts` (modified)
- `src/proxy.test.ts` (modified)
