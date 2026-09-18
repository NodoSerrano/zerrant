---
tags: [roadmap, milestone]
status: done
depends-on: "[[M3 · Membresía y roles]]"
---

# M4 · Plantel y directorio

**Objetivo:** el directorio de serranos, mostrando **Tier + Rol** como titular (la tarifa es secundaria).

**Entregable:** plantel navegable con filtros y detalle de miembro completo.

## Pantallas (diseño)

`2.2 Plantel` · `3.1 Detalle de miembro` · `3.3 Editar habilidades` · `3.4 Mis aportes` · `7.1 Vacío Plantel`.

## Datos

`skills` + `profile_skills`; lecturas de `profiles` (solo serranos). Ver [[Modelo de datos]] y [[Seguridad RLS]].

## Alcance

- [ ] Plantel: lista con **MemberCard** (Tier + Rol + disponibilidad).
- [ ] Filtros por rol, habilidad y disponibilidad + búsqueda.
- [ ] Detalle de miembro: Tier, Rol, aportes, proyectos, habilidades, tarifa secundaria (respetando visibilidad).
- [ ] Editar habilidades (tags con sugerencias normalizadas).
- [ ] "Mis aportes" (lista) — datos alimentados en [[M6 · Aportes y eventos]].
- [ ] Tourists no aparecen (RLS).

## Done (DoD)

- El plantel lista solo serranos, filtrable por rol/skill/disponibilidad.
- La tarifa privada no se filtra a quien no corresponde.

**Siguiente:** [[M5 · Proyectos]]
