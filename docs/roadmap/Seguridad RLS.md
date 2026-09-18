---
tags: [roadmap, referencia, seguridad]
---

# 🔒 Seguridad (RLS)

Las reglas de acceso viven en **Row Level Security de Postgres**, no solo en el front. Detalle en [[2026-07-20-nodo-serrano-backoffice-design|PRD §6]]. Tablas en [[Modelo de datos]].

## Principios

- Cada uno **edita su propio** `profiles`. Solo un admin (`is_platform_admin`) cambia `tier` e `is_platform_admin`.
- **Tourists** no aparecen en el plantel (lecturas filtran por tier ≠ tourist). Ver [[M4 · Plantel y directorio]].
- `tarifa_hora`: visible al dueño, admins, y a otros serranos solo si `visibilidad_tarifa = 'publica'` → resolver con **vista/policy** que oculte la columna. Riesgo abierto.
- `profile_roles.confirmado`: solo lo cambia un admin. Ver [[M3 · Membresía y roles]].
- `membership_requests`: el dueño crea/lee la suya; admins ven todas.
- `projects`/`project_members`: crear = cualquier serrano; editar config y aprobar ingresos = admins **de ese proyecto**; `ingreso=abierto` → entra aprobado, `aprobacion` → pendiente. Ver [[M5 · Proyectos]].
- `aportes`: lee serranos; inserta dueño o admin (económicos → Tesorería).
- `events`: lee autenticado; escribe serrano; edita/borra creador o admin.
- `tasks` UPDATE: policies separadas (creador / tomador / claim abierta / admin) + trigger `enforce_task_update_guard` (ZER-42). El tomador no puede setear `verificada` ni editar contenido vía PostgREST; solo admin verifica `hecha→verificada`.

## Dónde se implementa

- Migraciones SQL con policies, versionadas (ver [[Stack técnico]]).
- Se sientan las bases en [[M0 · Fundación]] y [[M1 · Cuenta y perfil]]; cada milestone agrega las policies de sus tablas.
