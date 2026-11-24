---
tags: [roadmap, milestone]
status: in-progress
depends-on: "[[M1 · Cuenta y perfil]]"
---

# M5 · Proyectos

> **Estado (2026-11-24):** Features `ZER-78` → `ZER-85` implementadas y en `main` (`v0.1.0-2026-10-16`). Pendiente: pasada QA DoD E2E (`ZER-86` en Backlog). En `develop` hay además ajustes post-QA (`ZER-151`, `ZER-199`, `ZER-200`, `ZER-201`, `ZER-224`) y en review `ZER-202` (PR `#166`).

**Objetivo:** proyectos de la comunidad con dinámica tipo grupo (ingreso abierto o por aprobación, admins de proyecto).

**Entregable:** sub-pestaña Proyectos en [[M2 · Nodo — Tasks|Nodo]], crear, detalle, unirse y gestión de ingresos.

## Pantallas (diseño)

`2.4 Nodo — Proyectos` · `4.3 Detalle de proyecto` · `4.4 Crear proyecto` · `4.5 Solicitudes de ingreso` · `7.3 Vacío Proyectos`.

## Datos

`projects`, `project_members` (rol `miembro/admin`, estado `pendiente/aprobado`). Ver [[Modelo de datos]] y [[Seguridad RLS]].

## Alcance

- [x] Crear proyecto: nombre, descripción, estado (`idea/en_curso/pausado/terminado`), ingreso (`abierto/aprobacion`).
- [x] Detalle: estado, miembros, admins; unirse (o solicitar).
- [x] Admin de proyecto: designar admins + aprobar/rechazar ingresos.
- [x] Proyectos de cada persona en su perfil.
- [x] RLS a nivel proyecto.

## Done (DoD)

- Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba.
- En un proyecto abierto, unirse es inmediato.

**Siguiente:** [[M6 · Aportes y eventos]]
