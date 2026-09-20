---
tags: [roadmap, milestone]
status: ticketized
depends-on: "[[M4 · Plantel y directorio]]"
---

# M7 · Cumpleaños, PWA y pulido

**Objetivo:** cerrar el MVP: cumpleaños, PWA instalable/offline, modo oscuro pulido y estados de sistema.

**Entregable:** app instalable, con dashboard de Inicio completo y estados finos.

## Pantallas (diseño)

`2.1 Inicio` (eventos + cumpleaños) · `7.5 Offline / error` · `7.6 404` · pulido de dark mode en todas.

## Datos

Deriva de `profiles.fecha_nacimiento` (edad + próximos cumples). Ver [[Modelo de datos]].

## Alcance

- [ ] Inicio: próximos eventos + próximos cumpleaños (cálculo de edad).
- [ ] PWA: manifest + íconos + service worker (offline shell). Ver [[Stack técnico]].
- [ ] Estados: offline/error, 404, loading/skeletons.
- [ ] Pulido de modo claro/oscuro en todas las pantallas.
- [ ] Pasada de accesibilidad y performance (Core Web Vitals).

## Done (DoD)

- La app se instala como PWA y abre offline el shell.
- Inicio muestra próximos cumpleaños correctamente.

**Backlog futuro:** [[Backlog]] (Puntos Serrano, notificaciones push).
