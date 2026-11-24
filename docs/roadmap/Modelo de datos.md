---
tags: [roadmap, referencia, datos]
---

# 🗃️ Modelo de datos

Resumen de tablas. Definición completa (columnas y enums) en el [[2026-07-20-nodo-serrano-backoffice-design|PRD §6]]. Las reglas de acceso viven en [[Seguridad RLS]].

| Tabla                          | Qué guarda                                                                                                                | Se crea en                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `profiles`                     | Datos del usuario: nombre/apellido/apodo, `nombre_visible`, `tier`, `is_platform_admin`, disponibilidad, tarifa, contacto | [[M1 · Cuenta y perfil]]      |
| `membership_requests`          | Solicitudes Tourist → Serrano                                                                                             | [[M3 · Membresía y roles]]    |
| `roles` + `profile_roles`      | Catálogo de roles y su asignación (con `confirmado`)                                                                      | [[M3 · Membresía y roles]]    |
| `skills` + `profile_skills`    | Habilidades (tags) y asignación                                                                                           | [[M4 · Plantel y directorio]] |
| `tasks`                        | Tareas del nodo (categoría, urgencia, estado)                                                                             | [[M2 · Nodo — Tasks]]         |
| `projects` + `project_members` | Proyectos y membresía (rol admin/miembro, estado)                                                                         | [[M5 · Proyectos]]            |
| `aportes`                      | Contribuciones (tipo, monto opcional)                                                                                     | [[M6 · Aportes y eventos]]    |
| `events` + `event_attendance`  | Eventos y RSVP                                                                                                            | [[M6 · Aportes y eventos]]    |

> **Nota:** `tasks` y `aportes` tendrán un campo `puntos` cuando salga de [[Backlog|Puntos Serrano]].
> **En `develop` (`Ready for Deploy`, 11 migraciones por delante de `main`):** se suman `donaciones` (`ZER-166`) y columnas de propuesta/aprobación en `skills` (`ZER-163` / `ZER-216`), además de ajustes en `tasks`, `projects`, `project_members` y `membership_requests`.

## Convenciones

- PK `uuid`; `profiles.id = auth.users.id`.
- Trigger en `auth.users` (insert) → crea `profiles` con `tier = 'tourist'` (ver [[M1 · Cuenta y perfil]]).
- Timestamps `created_at`. Enums en Postgres (o `text` + `check`, a decidir en [[M0 · Fundación]]).
