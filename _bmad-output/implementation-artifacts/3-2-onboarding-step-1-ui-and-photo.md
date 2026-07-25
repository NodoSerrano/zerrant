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
   **When** el usuario autenticado navega a cualquier ruta protegida sin haber terminado el onboarding
   **Then** el proxy lo manda al paso donde quedó (`/onboarding/step2` si el paso 1 ya está guardado, si no `/onboarding/step1`)
   **And** el onboarding se cierra al enviar el paso 2, que estampa `profiles.onboarding_completado_en`
   **And** con el onboarding cerrado, entrar a `/onboarding` saca a `/` — esos datos se editan en `/profile/edit`
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
- [x] **T6 — Red→Green: `onboarding_completado_en`** (AC: 5) — el paso 2 quedaba inalcanzable, ver abajo
- [x] **T7 — Verify**: 232/232 tests, typecheck, lint, y verificación end-to-end contra Supabase local
- [x] **T8 — Code review adversarial (3 capas) y sus 12 parches** — ver "Review Findings" y "Qué cambió después del review"

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

Después del review el script se rehízo con las reglas nuevas y corre 26/26: suma el bypass del paso 2, `/nodocosas` fuera del gate, los tres intentos de escalada de privilegios (403) contra la edición de datos propios (204), y el flujo completo paso 1 → paso 2 → app.

## Fix post-prueba: el paso 2 quedaba inalcanzable

Probando en el browser: al guardar el paso 1, la app mandaba directo a `/` y el paso 2 nunca aparecía. La causa es el criterio inferido: apenas se guardaban nombre/apellido/fecha, el gate daba el onboarding por cerrado y el redirect de reentrada pisaba el `redirect("/onboarding/step2")` de la action.

El paso 2 tiene todos sus campos opcionales, así que no hay dato del que inferir haberlo pasado. Fix: `profiles.onboarding_completado_en` (migración `20260725140000_onboarding_completado.sql`, con backfill de los perfiles que ya tenían el paso 1 hecho), estampado por `saveOnboardingStep2`. El gate ahora:

- sin marca y fuera de `/onboarding` → redirige al paso donde quedó (step2 si el paso 1 está guardado, si no step1)
- con marca y dentro de `/onboarding` → `/`

Flujo completo verificado end-to-end (usuario real, 7/7): nuevo → step1; con el paso 1 guardado → step2 visible y la app todavía bloqueada (retomando en step2); con el paso 2 enviado → la app se abre y `/onboarding` rebota a `/`.

## Qué cambió después del review

Los 12 parches, agrupados:

**Seguridad**

- `20260725160000_grants_por_columna.sql`: los grants de tabla se reemplazan por grants **por columna**. Antes, con RLS filtrando sólo filas, cualquier usuario podía `PATCH` su propia fila y setearse `is_platform_admin`/`tier`/`aprobado_en`. Verificado contra la DB local: los tres intentos dan 403 y editar los datos propios sigue dando 204.
- `next.config.ts`: `experimental.serverActions.bodySizeLimit: "6mb"`. El default de 1 MB hacía que cualquier foto de celular muriera en el framework antes de llegar a la validación de 5 MB — es decir, la feature principal de la story estaba rota para el caso típico.
- El paso 2 ya no se puede saltear: el proxy manda a step1 si faltan los datos obligatorios, y `saveOnboardingStep2` redirige en vez de estampar la marca.

**Robustez**

- El gate distingue "la fila no existe" (`PGRST116` → onboarding pendiente) de "la consulta falló" (deja pasar y loguea). Antes, un timeout encerraba a toda la app en el onboarding.
- Los prefijos de ruta comparan por segmento: `/nodocosas` ya no hereda el gate de `/nodo`.
- `fecha_nacimiento` se valida (formato, no futura, ≥ 1900) y `nombre_visible` se filtra contra el enum.
- Los errores de Postgres ya no llegan a la UI: mensaje en español y el detalle al log del server.

**UI**

- El preview de la foto ya no desaparece cuando un upload posterior falla.
- El `<input type=file>` se deshabilita mientras sube y sale del tab order y del árbol de accesibilidad (el control accesible es el botón).
- El submit del paso 1 se bloquea con la foto en vuelo ("Subiendo foto...").

**Tests y ruido**

- Tests nuevos del server component `page.tsx` (prefill, columnas leídas, perfil vacío, sin sesión).
- Assertions reales donde eran nominales: los controles del paso 1 se enumeran por rol y nombre; el ícono se busca por `svg.lucide` con `aria-hidden`.
- `database.types.ts` vuelve a ser el archivo de `main` + la columna nueva: se saca el churn de la regeneración (se había perdido `__InternalSupabase` y entrado el schema `graphql_public`).

**Diseño**

- El frame `bvpj5` se actualizó para reflejar lo implementado: sin chevron, "Paso 1 de 2" a la derecha y asteriscos en los tres campos obligatorios. La línea de CAP-5 en `SPEC.md` dice ahora que el onboarding no tiene control de salida.

Quedaron **deferidos** (en `deferred-work.md`): la guarda de `nombre_visible` en `updateProfile`, la doble consulta del perfil por navegación, `alter default privileges` para tablas futuras, el error silenciado del prefill, el 307 sobre POSTs de pestañas viejas y el host de `next/image`. Por decisión del owner se dejan como están la allowlist de `PROTECTED_PREFIXES` y el backfill del onboarding.

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

### Review Findings

<!-- code review 2026-07-25: 3 capas (adversarial, edge cases, acceptance) sobre el diff main...HEAD -->

- [x] [Review][Decision] Chevron "atrás" y asteriscos de requerido contradicen el `.pen` — el frame `bvpj5` tiene el chevron (`IRcTY`) y no tiene asteriscos; CAP-5 de `SPEC.md` pide "back" explícitamente. El código sigue los AC de esta story, pero Pencil/CAP-5 quedaron sin actualizar y el review de fidelidad va a fallar contra el frame — **resuelto**: se actualizó el frame `bvpj5` (chevron eliminado, "Paso 1 de 2" a la derecha, asteriscos en los tres obligatorios) y la línea de CAP-5 en `SPEC.md`
- [x] [Review][Decision] `PROTECTED_PREFIXES` es allowlist (default-open): toda ruta nueva nace sin gate de onboarding [src/proxy.ts:37] — ya falló una vez (faltaba `/nodo`). **resuelto**: se deja la allowlist por decisión del owner; queda como deuda conocida
- [x] [Review][Decision] El backfill marca completos a los usuarios que estaban en tránsito (paso 1 hecho, paso 2 pendiente) [supabase/migrations/20260725140000_onboarding_completado.sql:12] — nunca van a ver el paso 2 — **resuelto**: se deja así por decisión del owner (los campos del paso 2 son opcionales y editables en `/profile/edit`)
- [x] [Review][Patch] Escalada de privilegios: `grant update` a nivel tabla deja auto-setear `is_platform_admin`/`tier`/`aprobado_en` vía PostgREST [supabase/migrations/20260725033000_grants_authenticated.sql:11] — viola `docs/roadmap/Seguridad RLS.md`; hacen falta grants por columna
- [x] [Review][Patch] Las fotos de 1–5 MB fallan con error opaco: el body de server actions está capado en 1 MB por default [next.config.ts] — la validación de 5 MB de `avatar.ts` es inalcanzable
- [x] [Review][Patch] Se puede cerrar el onboarding sin hacer el paso 1 entrando directo a `/onboarding/step2` [src/proxy.ts:73, src/features/profile/actions.ts:82] — perfil "completo" con nombre/apellido/fecha en null
- [x] [Review][Patch] El gate confunde "la query falló" con "onboarding pendiente" [src/proxy.ts:66] — un error transitorio encierra a todos en el onboarding
- [x] [Review][Patch] Un upload fallido borra el preview de la foto ya guardada [src/components/AvatarPicker.tsx:26]
- [x] [Review][Patch] El `<input type=file>` no se deshabilita durante el upload y no tiene nombre accesible [src/components/AvatarPicker.tsx:65]
- [x] [Review][Patch] Se puede enviar el paso 1 con la foto todavía subiendo [src/app/(app)/onboarding/step1/Step1Form.tsx:45]
- [x] [Review][Patch] `fecha_nacimiento` y `nombre_visible` sin validar: errores crudos de Postgres en inglés llegan a la UI [src/features/profile/actions.ts:36]
- [x] [Review][Patch] `page.tsx` (server component nuevo) sin tests, con TDD obligatorio [src/app/(app)/onboarding/step1/page.tsx:6]
- [x] [Review][Patch] `startsWith` sin frontera de segmento: `/nodocosas` o `/profiles` heredan el gate [src/proxy.ts:37]
- [x] [Review][Patch] Churn incidental en los tipos generados: se perdió `__InternalSupabase.PostgrestVersion` y entró el schema `graphql_public` [src/lib/supabase/database.types.ts:4]
- [x] [Review][Patch] Tests nominales: `querySelector("a")` como prueba de "sin botón atrás" y `querySelector("svg")` como prueba del ícono de cámara [src/features/profile/**tests**/step1-form.test.tsx:17]
- [x] [Review][Defer] `updateProfile` y `saveOnboardingStep2` siguen sin guarda para `nombre_visible` ni trim [src/features/profile/actions.ts:203] — deferred, pre-existente
- [x] [Review][Defer] Doble consulta del perfil por navegación (proxy + page) y una query extra en cada prefetch [src/proxy.ts:66] — deferred, optimización
- [x] [Review][Defer] Los grants no cubren tablas futuras (falta `alter default privileges`) [supabase/migrations/20260725033000_grants_authenticated.sql] — deferred, la próxima tabla repite el 42501
- [x] [Review][Defer] El prefill silencia el error de lectura del perfil y muestra el form vacío [src/app/(app)/onboarding/step1/page.tsx:14] — deferred, degradación aceptable
- [x] [Review][Defer] El rebote de `/onboarding` con 307 también afecta POSTs de server actions de pestañas viejas [src/proxy.ts:82] — deferred, edge raro
- [x] [Review][Defer] `next/image` rompe el render si `avatar_url` apunta a un host fuera de `remotePatterns` [src/components/AvatarPicker.tsx:51] — deferred, es config de deploy

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

- 250/250 tests (199 antes de la story: +51)
- `pnpm typecheck` y `pnpm lint` limpios
- Migración de grants aplicada en local (`supabase migration up --local`) y verificada con un usuario real
- Pendiente del owner: `supabase db push` a prod (incluye la migración de ZER-12 y ésta) y una pasada visual en el browser a 390px contra el frame `bvpj5`

### Change Log

| Fecha      | Cambio                                                           |
| ---------- | ---------------------------------------------------------------- |
| 2026-07-25 | Story implementada en `juanpe44/zer-13-onboarding-step1-photo`   |
| 2026-07-25 | Fix: el paso 2 quedaba inalcanzable → `onboarding_completado_en` |
| 2026-07-25 | Code review adversarial: 12 parches aplicados, 6 diferidos       |

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
- `supabase/migrations/20260725140000_onboarding_completado.sql` (new)
- `supabase/migrations/20260725160000_grants_por_columna.sql` (new)
- `src/features/profile/__tests__/step1-page.test.tsx` (new)
- `src/lib/supabase/database.types.ts` (modified)
- `src/features/profile/displayName.test.ts` (modified)
- `next.config.ts` (modified)
- `design/nodo-serrano.pen` — frame `bvpj5` (modified)
- `_bmad-output/specs/spec-ui-fidelity-m0-m2/SPEC.md` — CAP-5 (modified)
