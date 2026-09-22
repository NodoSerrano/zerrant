---
tags: [roadmap, referencia, diseño]
---

# 🎨 Design system

Extraído de Figma. Detalle de tokens en [[2026-07-20-nodo-serrano-backoffice-design|PRD §8]]. Diseño navegable en `design/nodo-serrano.pen` (Pencil).

## Tokens

- **Tipografía:** `Space Grotesk` (display/títulos), `Inter` (body).
- **Color base (claro):** fondo `#f8f4ed`, card `#fefbf6`, texto `#1a1614`. Soporta **modo oscuro** (tokens temáticos).
- **Marca (sólidos Pencil):** mint `#0a8268` · green `#0c8a5e` · blue `#1158b0` · violet `#6b3fa8`. Acentos: coral `#c70067`, amarillo `#ff9728`.
- **Rampa CTA (Figma web / landing `grad-primary`):** mint-raw `#4fe6c3` → blue-raw `#2e9bff` → grad-violet `#c87fe5` vía utilidad `bg-gradient-brand` (ZER-120). Warm: yellow → warm-red `#ff3121` → warm-violet (`bg-gradient-warm`).
- **Efectos:** neumórficos + sombras suaves de card; CTAs con gradiente de marca compartido.

## Componentes (en el `.pen`)

Avatar, Chip, **TierBadge**, **RoleChip**, PrimaryButton, SecondaryButton, Input, StatusBar, **TabBar** (4 tabs: Inicio · Plantel · Agenda · Perfil; sin Nodo — ZER-107), MemberCard, EventCard, ProjectCard, TaskCard, AporteItem, RequestCard.

## Implementación

- Los tokens se mapean a un tema de Tailwind (`@theme`) en [[M0 · Fundación]].
- Los componentes se codean como React components reutilizables, alineados 1:1 con los del `.pen`.
- Las 38 pantallas del diseño están mapeadas a los milestones (ver cada `M*`).
