---
tags: [roadmap, milestone]
status: done
depends-on: "[[M1 · Cuenta y perfil]]"
---

# M6 · Aportes y eventos

> **Estado (2026-11-24):** Features (`ZER-87` → `ZER-96`) y QA DoD (`ZER-97`) cerrados en Linear y desplegados en `main` (`v0.1.0-2026-10-16`). En `develop` (`Ready for Deploy`) se suma además la expansión de donaciones materiales (`ZER-166`).

**Objetivo:** registrar aportes (económicos y en especie) y manejar la agenda de eventos con RSVP.

**Entregable:** registro de aportes visible en el perfil + calendario con creación y confirmación de asistencia.

## Pantallas (diseño)

`4.6 Registrar aporte` · `3.4 Mis aportes` · `2.5 Agenda` · `5.1 Detalle de evento` · `5.2 Crear evento` · `5.3 Editar evento` · `7.4 Vacío Agenda`.

## Datos

`aportes`, `events`, `event_attendance`. Ver [[Modelo de datos]] y [[Seguridad RLS]].

## Alcance

- [x] Registrar aporte: tipo, descripción, fecha, monto opcional; carga propia y de admin.
- [x] Aportes en perfil / detalle de miembro (alimenta [[M4 · Plantel y directorio]]).
- [x] Agenda: crear (cualquier serrano), tira de días, detalle.
- [x] RSVP: `voy / quizás / no` + lista de asistentes.
- [x] Editar/eliminar evento (creador o admin).

## Done (DoD)

- Se registra un aporte y aparece en el perfil.
- Se crea un evento, la gente confirma y se ve la lista de asistentes.

**Siguiente:** [[M7 · Cumpleaños, PWA y pulido]]
