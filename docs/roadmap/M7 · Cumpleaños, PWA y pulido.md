---
tags: [roadmap, milestone]
status: in-progress
depends-on:
  - "[[M2 · Nodo — Tasks]]"
  - "[[M4 · Plantel y directorio]]"
  - "[[M5 · Proyectos]]"
  - "[[M6 · Aportes y eventos]]"
---

# M7 · Cumpleaños, PWA y pulido

> **Estado (2026-11-24):** Features `ZER-98` → `ZER-104` implementadas y en `main` (`v0.1.0-2026-10-16`). Pendiente: pasada QA DoD E2E (`ZER-105` en Backlog).

**Objetivo:** cerrar el MVP: cumpleaños, PWA instalable/offline, modo oscuro pulido y estados de sistema.

**Entregable:** app instalable, con dashboard de Inicio completo y estados finos.

## Pantallas (diseño)

`2.1 Inicio` (eventos + cumpleaños) · `7.5 Offline / error` · `7.6 404` · pulido de dark mode en todas.

## Datos

Deriva de `profiles.fecha_nacimiento` (edad + próximos cumples). Ver [[Modelo de datos]].

## Alcance

- [x] Inicio: próximos eventos + próximos cumpleaños (cálculo de edad).
- [x] PWA: manifest + íconos + service worker (offline shell). Ver [[Stack técnico]].
- [x] Estados: offline/error, 404, loading/skeletons.
- [x] Pulido de modo claro/oscuro en todas las pantallas.
- [x] Pasada de accesibilidad y performance (Core Web Vitals).

## Done (DoD)

- La app se instala como PWA y abre offline el shell.
- Inicio muestra próximos cumpleaños correctamente.

**Backlog futuro:** [[Backlog]] (Puntos Serrano, notificaciones push).
