---
tags: [roadmap, milestone]
status: done
depends-on: "[[M1 · Cuenta y perfil]]"
---

# M2 · Nodo — Tasks

**Objetivo:** validar cuanto antes el flujo de **cargar tareas** del nodo. Sin puntaje (ver [[Backlog|Puntos Serrano]]).

**Entregable:** tab **Nodo** con listado de tareas, crear tarea, detalle y tomar. Es el primer feature "de verdad" para testear con la comunidad.

## Pantallas (diseño)

`2.3 Nodo — Tareas` · `4.1 Detalle de tarea` · `4.2 Crear tarea` · `7.2 Vacío Tareas`.

## Datos

`tasks` (categoría, urgencia, estado `abierta→tomada→hecha→verificada`, `tomada_por`). Ver [[Modelo de datos]].

## Alcance

- [ ] Tab **Nodo** (hub) con sub-pestaña **Tareas** (la de Proyectos llega en [[M5 · Proyectos]]).
- [ ] Crear tarea: título, descripción, categoría, urgencia.
- [ ] Listado con estado + acción **Tomar**; detalle de tarea.
- [ ] Marcar **hecha**; verificación simple (a definir quién confirma).
- [ ] Estado vacío.
- [ ] RLS: crear = cualquier serrano; tomar/actualizar según reglas.

## Fuera de alcance

Puntaje/valuación (parkeado), sub-pestaña Proyectos.

## Done (DoD)

- Se publica una tarea y aparece en el listado.
- Otro serrano la toma y se marca como hecha.

**Siguiente:** [[M3 · Membresía y roles]]
