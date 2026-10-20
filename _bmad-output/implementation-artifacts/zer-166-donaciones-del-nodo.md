# ZER-166: Donaciones del Nodo

Status: in-progress

## Linear

- **ZER-166** — Definir y registrar aportes a la comunidad
- Parent epic: **ZER-130** EPIC Contributions
- URL: https://linear.app/zerrant/issue/ZER-166
- Branch: `estudionomade2025/zer-166-donaciones-del-nodo` (from `upstream/develop`)
- Project: Nodo Serrano — Revisión Oct 2026

## Product package (cerrado 2026-10-19)

1. **Nombre UI:** “Donaciones del Nodo”
2. **Dominio:** extender tabla M6 `aportes` + inventario del bien (no tabla paralela)
3. **Tipos UI:** `regalo` | `por un tiempo` → DB `donacion` | `prestamo` (enum M6 intacto)
4. **Aprobación:** platform admin; sin self-approve; pendiente → aprobado | rechazado
5. **Visibilidad:** turista nunca; dueño ve propios cualquier estado; admin todo + cola; serrano ve **aprobadas** de la comunidad (+ ledger M6 sin workflow)
6. **Campos MVP:** título (req), descripción (opt), tipo (req), fecha (default hoy), imagen **opcional**, **sin** valor estimado, notas admin en approve/reject

## Out of scope

- Pagos / propinas / cafecitos
- Inventario contable completo / valor monetario en donaciones
- Cambiar el ledger M6 “Mis aportes” (economico, charla, etc.) más allá de coexistir

## Story

As a serrano,
I want to register a material donation to the Nodo (gift or temporary loan) pending admin approval,
so the community inventory is trustworthy and tourists cannot read private contribution history.

## Acceptance Criteria

1. **Given** tipos UI regalo | por un tiempo  
   **When** un miembro no-turista registra una donación  
   **Then** se inserta en `aportes` con `estado = pendiente`, `profile_id = auth.uid()`, `tipo` mapeado a `donacion`|`prestamo`, `titulo` obligatorio, sin `monto`, y queda ligada a su perfil.

2. **Given** una donación pendiente del mismo miembro  
   **When** ese miembro intenta aprobarla  
   **Then** falla (sin self-approve). Un **platform admin** distinto del dueño puede aprobar/rechazar y se guardan `aprobado_por` + `aprobado_en` (+ notas opt).

3. **Given** un turista  
   **When** lee `aportes` / historial de donaciones  
   **Then** no ve filas (RLS).

4. **Given** un serrano no-admin  
   **When** lista el historial comunitario de donaciones  
   **Then** solo ve `estado = aprobado` (y el ledger M6 sin workflow: `estado is null`). Sus propias pendientes/rechazadas las ve en “mis donaciones”.

5. **Given** donación pendiente  
   **When** el dueño edita/borra  
   **Then** OK. **Given** aprobada/rechazada  
   **When** el dueño no-admin intenta editar/borrar  
   **Then** rechazado; admin puede archivar/gestionar.

6. **Given** imagen opcional  
   **When** el alta incluye archivo válido  
   **Then** se guarda path en storage bucket de donaciones; si no hay archivo, `imagen_path` null. Sin valor estimado en form ni schema de cobro.

7. **Given** TDD  
   **When** done  
   **Then** tests RED→GREEN en schema/migración, actions (create/approve/reject), helpers de tipo/visibilidad; `pnpm test`, `typecheck`, `lint` green.

## Tasks

- [ ] T0 Story + product ACs (this file)
- [ ] T1 RED schema contract + migration SQL tests
- [ ] T2 GREEN migration (estado, titulo, imagen, approve cols, RLS, RPC, storage)
- [ ] T3 Types `database.types.ts` + `aportes-schema` extension
- [ ] T4 RED/GREEN actions createDonacion / approve / reject
- [ ] T5 UI: form + list mis donaciones + admin cola + menú
- [ ] T6 Verify full suite

## Technical design

### Columns on `public.aportes`

| column         | notes                                                      |
| -------------- | ---------------------------------------------------------- |
| `titulo`       | text null for legacy M6; required for donation flow in app |
| `estado`       | `aporte_estado` null = ledger M6 (no approval queue)       |
| `imagen_path`  | text null                                                  |
| `aprobado_por` | uuid → profiles null                                       |
| `aprobado_en`  | timestamptz null                                           |
| `notas_admin`  | text null                                                  |

Enum `aporte_estado`: `pendiente`, `aprobado`, `rechazado`.

Enum `aporte_tipo`: **unchanged** 9 values. UI donation types map:

- `regalo` → `donacion`
- `por_un_tiempo` → `prestamo`

### RLS (replace SELECT; tighten UPDATE/DELETE)

- SELECT: platform admin OR (non-tourist AND (`estado` is null OR `estado = 'aprobado'` OR `profile_id = auth.uid()`))
- INSERT: same owner/admin as M6; donation inserts set `estado='pendiente'`
- UPDATE/DELETE content: owner only if `estado is null OR estado = 'pendiente'`; admin always (content). **Estado transitions only via RPC.**

### RPCs (security definer)

- `approve_aporte_donacion(p_id, p_notas text default null)`
- `reject_aporte_donacion(p_id, p_notas text default null)`

Both: caller platform admin; row `estado='pendiente'`; `profile_id <> auth.uid()` (no self-approve); set actor+timestamp.

### Grants

- No direct UPDATE grant on `estado`, `aprobado_por`, `aprobado_en` for authenticated (RPC only).
- Insert may include `titulo`, `estado`, `imagen_path`.

### App surface

- Routes under `/donaciones` (list + new) and `/admin/donaciones` (pending queue)
- Menu: “Donaciones del Nodo” (serrano); keep “Mis aportes” M6 as-is
- Feature module: extend `src/features/aportes/` with donation helpers + actions OR `src/features/donaciones/`

## Dev notes

- M6 `createAporte` keeps writing `estado=null` so Mis aportes unchanged.
- Image upload pattern: copy avatars bucket policies with folder `auth.uid()/`.
- Never GRANT ALL; follow ZER-49 column grants.
- Base PR: `develop`.
