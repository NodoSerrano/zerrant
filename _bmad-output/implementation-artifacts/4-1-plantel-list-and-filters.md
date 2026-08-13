---
story_key: 4-1-plantel-list-and-filters
linear: ZER-32
pencil_frame: Gy33r
---

# Story 4.1: Plantel list + filters (2.2 / 7.1)

Status: ready-for-dev

## Story

As a serrano,
I want a searchable, filterable directory of members,
so that I can find people by name, skill, role, or availability.

## Acceptance Criteria

Pencil-verified: `Gy33r` (2.2) + `jNOdD` (7.1) + component `O21Fvt` (MemberCard).

### 1. Schema

Create `skills` (id, nombre unique, created_at) and `profile_skills` (profile_id, skill_id, PK both). RLS: authenticated can read both; only the owner can insert/delete own `profile_skills`. Grants for `authenticated`. Tourists must not appear in plantel (filter `tier != 'tourist'` and/or RLS). Seed a small skill catalog (enough for suggestions later).

### 2. Route `/plantel`

**Given** an authenticated user
**When** they open `/plantel`
**Then** header `Plantel` (`font-display text-[24px] font-bold`) + subtitle `{n} serranos en la comunidad` (`font-body text-[13px] text-text-secondary`)
**And** wrapper pad Pencil `[8,20,20,20]`, gap 16
**And** search field placeholder exactly `Buscar por nombre o skill` with Lucide `search` 18
**And** filter chips: `Todos` (active: on-primary text on brand fill) · `Disponibles` · `Por rol` · `Por skill` (inactive: `text-text-secondary`)
**And** list gap 12 of `MemberCard`

Unauthenticated → `/auth/login`.

### 3. MemberCard (`O21Fvt`)

- Card: `rounded-[24px] bg-surface p-4 flex flex-col gap-3.5`
- Row: Avatar (initials fallback) + name `font-display text-[17px] font-medium` + TierBadge + disponibilidad text + `chevron-right` 20 `#8a847c`
- Chips row: confirmed roles as RoleChip (icon + label). Unconfirmed roles hidden.
- Entire card is a link to `/plantel/[id]` (detail is ZER-33 — link may 404 until then; still wire href)

### 4. Filters + empty (7.1)

- `Todos`: all serranos
- `Disponibles`: `disponibilidad = 'disponible'`
- `Por rol` / `Por skill`: open a chooser of existing roles/skills (keep it simple: second chip row or select). Do not invent a modal that is not in Pencil if a compact list works.
- Search: case-insensitive match on display name or skill name
- No matches: title `Sin resultados` (20 bold) + `No encontramos serranos con esos filtros. Probá con otra habilidad o limpiá la búsqueda.` + `Limpiar filtros`
- Count in subtitle updates to the **unfiltered** serrano total (Pencil still shows “24 serranos…” on the empty frame)

### 5. TabBar

Wire `plantel` tab → `/plantel`. Mark active when pathname starts with `/plantel`. Do not implement Inicio/Agenda routes.

### 6. Out of scope

Member detail (ZER-33), edit skills (ZER-34), aportes (ZER-35), M5 projects.

### 7. Tests

TDD. Schema not required in Vitest if you mock data. Cover: list renders cards, tourist excluded, search, empty copy, tab href. `pnpm test` + typecheck + lint.

## Tasks

- [ ] T1 — migration + types
- [ ] T2 — `/plantel` page + MemberCard + tests
- [ ] T3 — filters / search / empty
- [ ] T4 — TabBar link + verify

## Dev Notes

Reuse `Avatar`, `TierBadge`, `RoleChip`, `displayName`. Feature folder `src/features/plantel/`. Route `src/app/(app)/plantel/page.tsx`. TabBar today is buttons with no navigation (`TabBarClient` ignores `onTabChange`) — this story must make tabs real links (or at least plantel + existing nodo/profile). Prefer `<Link>` per tab (ZER-25 lesson).

Do not show tourists. Do not invent `/plantel` data — read `profiles` + confirmed `profile_roles` + `profile_skills`.

## Dev Agent Record

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List
