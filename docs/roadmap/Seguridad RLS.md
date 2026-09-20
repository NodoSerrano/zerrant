---
tags: [roadmap, referencia, seguridad]
---

# 🔒 Seguridad (RLS)

Las reglas de acceso viven en **Row Level Security de Postgres**, no solo en el front. Detalle en [[2026-07-20-nodo-serrano-backoffice-design|PRD §6]]. Tablas en [[Modelo de datos]].

## Principios

- Cada uno **edita su propio** `profiles`. Solo un admin (`is_platform_admin`) cambia `tier` e `is_platform_admin`.
- **Tourists** no aparecen en el plantel (lecturas filtran por tier ≠ tourist). Ver [[M4 · Plantel y directorio]].
- `tarifa_hora`: visible al dueño, admins, y a otros serranos solo si `visibilidad_tarifa = 'publica'`. Enforced in DB via `public.profiles_with_rate` (masked column) + column SELECT revoke of base `profiles.tarifa_hora` for `authenticated` (ZER-43). Base table reads must omit `tarifa_hora` / avoid `select *`.
- `profile_roles.confirmado`: solo lo cambia un admin. Ver [[M3 · Membresía y roles]].
- `membership_requests`: el dueño crea/lee la suya; admins ven todas.
- `projects`/`project_members`: crear = cualquier serrano; editar config y aprobar ingresos = admins **de ese proyecto**; `ingreso=abierto` → entra aprobado, `aprobacion` → pendiente. Ver [[M5 · Proyectos]].
- `aportes`: lee serranos; inserta dueño o admin (económicos → Tesorería).
- `events`: lee autenticado; escribe serrano; edita/borra creador o **platform admin** (`profiles.is_platform_admin`). `creado_por` es inmutable (grant + policy). Sin columna `estado` en `events` (ZER-91).
- `event_attendance`: lee autenticado (lista de asistentes en detalle); insert/update/delete solo de la fila propia (`profile_id = auth.uid()`). Insert restringido a serranos (tourist no RSVP). Borrado de evento cascadea filas de asistencia (`ON DELETE CASCADE`). Admin de plataforma no necesita mutar RSVPs ajenos en MVP (ZER-91).
- `tasks` UPDATE: policies separadas (creador / tomador / claim abierta / admin) + trigger `enforce_task_update_guard` (ZER-42). El tomador no puede setear `verificada` ni editar contenido vía PostgREST; solo admin verifica `hecha→verificada`.

## Grants vs RLS (PostgREST)

RLS only runs **after** table privileges. If `authenticated` has no GRANT on a table, PostgREST returns `42501 permission denied` and never evaluates policies.

- **Existing tables:** explicit GRANTs in migrations (often column-level; see ZER-43 on `profiles.tarifa_hora`).
- **New tables:** `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public` so objects created by migrations inherit DML for `anon` / `authenticated` / `service_role` without a per-table GRANT (ZER-49, `20260919011500_zer49_default_privileges_for_role.sql`). Still enable RLS + policies on every exposed table.
- **Automated check:** `pnpm db:check-grants` (CI job `db grants (authenticated)`) fails if any public **base** table lacks authenticated DML (table- or column-level) or if `postgres` is missing default privileges that grant authenticated table DML. Local probe: `scripts/zer49-probe-new-table.sql`.

## Dónde se implementa

- Migraciones SQL con policies, versionadas (ver [[Stack técnico]]).
- Se sientan las bases en [[M0 · Fundación]] y [[M1 · Cuenta y perfil]]; cada milestone agrega las policies de sus tablas.
