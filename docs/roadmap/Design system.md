---
tags: [roadmap, referencia, diseño]
---

# 🎨 Design system

Extraído de Figma. Detalle de tokens en [[2026-07-20-nodo-serrano-backoffice-design|PRD §8]]. Diseño navegable en `design/nodo-serrano.pen` (Pencil).

## Tokens

- **Tipografía:** `Space Grotesk` (display/títulos), `Inter` (body).
- **Color base (claro):** fondo `#f8f4ed`, card `#fefbf6`, texto `#1a1614`. Soporta **modo oscuro** (tokens temáticos).
- **Marca:** mint `#0a8268` · green `#0c8a5e` · blue `#1158b0` · violet `#6b3fa8`. Acentos: coral `#c70067`, amarillo `#ff9728`.
- **Efectos:** neumórficos + sombras suaves de card; CTAs con gradiente.

## Componentes (en el `.pen`)

Avatar, Chip, **TierBadge**, **RoleChip**, PrimaryButton, SecondaryButton, Input, StatusBar, **TabBar** (5 tabs), MemberCard, EventCard, ProjectCard, TaskCard, AporteItem, RequestCard.

## Implementación

- Los tokens se mapean a un tema de Tailwind (`@theme`) en [[M0 · Fundación]].
- Los componentes se codean como React components reutilizables, alineados 1:1 con los del `.pen`.
- Las 38 pantallas del diseño están mapeadas a los milestones (ver cada `M*`).
