---
baseline_commit: 9cac749
---

# Story 3.4: Pantalla post-solicitud (1.8)

Status: review

<!-- Story context engine — from Linear ZER-27, Pencil frame `bWMOv` (verified via Pencil MCP),
epics.md epic-3-membresia story 3.4, and the existing /solicitar flow delivered by ZER-25. -->

## Story

As a tourist with a pending membership request,
I want `/profile` to show Pencil 1.8 "Solicitud en revisión" instead of the "Solicitar ser Serrano" banner,
so that I know my request is being processed and what happens next.

## Acceptance Criteria

### 1. Pending-request branch (FR21)

**Given** `tier = tourist` AND a `membership_requests` row with `estado = 'pendiente'` for the user
**When** `/profile` renders
**Then** the full 1.8 screen renders INSTEAD of identity card / CTA banner / TouristMenu
**And** none of the tourist shell chrome appears on that render

### 2. No-pending branch → wired CTA

**Given** a tourist WITHOUT a pending request
**When** `/profile` renders
**Then** the existing tourist shell renders unchanged
**And** the CTA "Solicitar ser Serrano" navigates to `/solicitar` (supersedes the intentional no-op from story 3.4-tourist-profile-shell / ZER-15)
**And** CTA styling is preserved exactly: `rounded-pill bg-on-primary h-[46px] flex items-center justify-center w-full`, text `font-display text-[15px] font-semibold text-brand-blue`

### 3. Serrano branch unchanged

**Given** `tier !== 'tourist'`
**When** `/profile` renders
**Then** the serrano branch renders exactly as today (no membership_requests query added to that path)

### 4. Fail closed on read error

**Given** the membership_requests read fails (timeout, 5xx, RLS denial)
**When** `/profile` renders
**Then** the normal tourist shell renders — NEVER the 1.8 screen
**And** this matches the existing fail-closed guard convention in `src/app/(app)/solicitar/page.tsx`

### 5. Visual parity with Pencil `bWMOv` (screen 1.8)

**Given** the pending branch renders
**Then** the screen matches:

| Element          | Spec                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrapper          | center column, gap `[20px]`, padding `[24, 24, 28, 24]`, min-h fills content area                                                                                                 |
| Icon circle      | 92×92 circle `bg #ff972820`, centered Lucide `Hourglass` 40×40 `color #ff4d21`                                                                                                    |
| Title            | "Tu cuenta está en revisión" — Space Grotesk (`font-display`) 22px weight 500, centered                                                                                           |
| Subtitle         | EXACT copy: "Un admin de Nodo va a revisar tu solicitud pronto. Cuando te aprueben, pasás de Turista a Serrano y vas a aparecer en el plantel." — centered, muted secondary color |
| Status card      | horizontal pill row: chip "Turista" (`text #ff4d21` on `bg #ff972820`) → Lucide `ArrowRight` (muted) → chip "Serrano" (`text #8a847c` on `bg #f1ebe0`)                            |
| Info row         | Lucide `Compass` icon + copy "Mientras tanto, explorá el plantel y la agenda"                                                                                                     |
| Primary CTA      | "Explorar Nodo" → navigates to `/nodo/tasks` (plantel listing is M4, out of scope)                                                                                                |
| Secondary action | "Cerrar sesión" → calls existing `signOut()` server action                                                                                                                        |

**And** all texts are final copy — no lorem, no placeholders.

### 6. Tests (NFR2)

- Pending branch renders 1.8 elements (title, chips, CTAs) and NOT the banner/menu.
- No-pending branch renders CTA as a link pointing to `/solicitar`.
- Read error → tourist shell renders (fail closed).
- Serrano branch untouched (existing suite stays green).

## Tasks / Subtasks

- [x] Task 1: Wire CTA to `/solicitar` in tourist branch (AC: 2)
  - [x] Failing test first: CTA is a link with href `/solicitar`
  - [x] Replace `<div>`/`<span>` CTA markup with `<Link>`
- [x] Task 2: Query pending request + page branch (AC: 1, 3, 4)
  - [x] Failing test first: pendiente → 1.8 replaces shell; error → shell stays
  - [x] Add `membership_requests` query (only in tourist path) with `.maybeSingle()`
- [x] Task 3: Build post-request screen component (AC: 5)
  - [x] New client component next to `TouristMenu.tsx` (logout needs interactivity; mirror its `signOut` usage)
  - [x] Server page renders it inside `(app)` layout chrome (StatusBar/TabBar stay)
- [x] Task 4: Full validation (AC: 6)
  - [x] `pnpm test`, `pnpm typecheck`, `pnpm lint`
  - [x] Manual smoke: tourist sin solicitud → CTA navega; con solicitud pendiente (insert manual por Studio) → 1.8

## Dev Notes

- **Current state of `profile/page.tsx`**: server component; queries `profiles` with `.single()`; `isTourist` branch returns identity card + gradient banner + `<TouristMenu />`. The CTA at lines ~70-74 is `<div><span>Solicitar ser Serrano</span></div>` — dead markup BY DESIGN until now (story 3.4-tourist-profile-shell/ZER-15 specified it as no-op "until M3"; this story supersedes that clause).
- **Query shape**: `supabase.from("membership_requests").select("id").eq("profile_id", user.id).eq("estado", "pendiente").limit(1).maybeSingle()` — run ONLY in the tourist path. Table + RLS exist since migration `20260728190000_membership_roles.sql` (owner can read own rows). Grants DML landed in PR #23 (ZER-37).
- **Fail-closed convention**: `solicitar/page.tsx` uses `NO_ROWS = "PGRST116"` + warns and proceeds; replicate: any other error → treat as "no visible pending state".
- **Logout interactivity**: `TouristMenu.tsx` is `"use client"` and imports `signOut` from `@/features/auth/actions`; the new screen follows the same co-location + client-component pattern (`src/app/(app)/profile/PostRequestScreen.tsx`).
- **Icons**: `lucide-react` v1.26 — verify `Hourglass`, `ArrowRight`, `Compass` exist there before use (Mountain/UserRound/Moon/LogOut/Pencil already used in this tree).
- **Tests**: extend `src/features/profile/__tests__/profile-tourist.test.tsx`. Its Supabase mock builds chains per table (`from` → `select` → `eq` → `single`); add a second table branch for `membership_requests` ending in `maybeSingle`. Keep `profile-serrano.test.tsx` green (no mock changes needed if serrano path skips the new query).
- **Out of scope**: 1.9 confirmation toast (ZER-26), plantel/agenda routes, TabBar layout, admin queue changes.

### Project Structure Notes

- New file(s) co-located in `src/app/(app)/profile/` mirroring `TouristMenu.tsx`/`SerranoMenu.tsx` pattern. No schema changes, no new dependencies.

### References

- [Source: Linear ZER-27] — ACs verified against Pencil frame `bWMOv` (MCP).
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4 epic membresía]
- [Source: src/app/(app)/solicitar/page.tsx] — guard + NO_ROWS convention.
- [Source: src/app/(app)/profile/TouristMenu.tsx] — client component + signOut pattern.
- [Source: docs/roadmap/Seguridad RLS.md §membership_requests]

## Dev Agent Record

### Agent Model Used

ox-alpha (opencode CLI)

### Debug Log References

- RED/GREEN verificado por tarea: CTA link (1 fail→pass), pending branch (2 fail→pass).
- Tests de paridad visual del chrome 1.8 se agregaron como spec-lock tras implementar el componente junto con la rama pendiente (unidad única de implementación).

### Completion Notes List

- CTA "Solicitar ser Serrano" dejó de ser no-op (cláusula de ZER-15 superseded): ahora es `<Link href="/solicitar">` con estilos intactos.
- `/profile` consulta `membership_requests` (estado pendiente, `.maybeSingle()`) SOLO en la rama tourist.
- Con solicitud pendiente renderiza `PostRequestScreen` (Pencil 1.8 `bWMOv`): hourglass circle 92/#ff972820, título 22/500, subtitle exacto, chips Turista→Serrano, línea compass, CTA Explorar Nodo → `/nodo/tasks`, logout vía `signOut`.
- Read error falla cerrado: muestra shell tourist, nunca 1.8 (convención de solicitar/page.tsx).
- Rama serrano sin cambios; suite completa 691 ✓ typecheck ✓ lint ✓.

### File List

- src/app/(app)/profile/page.tsx (modified)
- src/app/(app)/profile/PostRequestScreen.tsx (new)
- src/features/profile/**tests**/profile-tourist.test.tsx (modified)
