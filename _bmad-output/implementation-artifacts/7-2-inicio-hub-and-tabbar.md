# Story 7.2: Inicio hub + TabBar Inicio (`2.1`)

Status: in-progress

## Linear

- **ZER-99** — Story 7.2: Inicio (2.1) eventos + cumpleaños y TabBar
- URL: https://linear.app/zerrant/issue/ZER-99/story-72-inicio-21-eventos-cumpleanos-y-tabbar
- Branch: `juantandil123/zer-99-story-72-inicio-21-eventos-cumpleanos-y-tabbar`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Unblocks M7 DoD bullet _"Inicio muestra próximos cumpleaños correctamente."_
- Depends on: story 7.1 (ZER-98); **M6 `events` readable** on the implementation branch.

## Story

As a member,
I want Inicio with upcoming events and birthdays and a real Inicio tab,
so that the fifth TabBar destination is honest and the home dashboard exists.

## Acceptance Criteria

1. **Given** Pencil frame `2.1 · Inicio` node id is `TBD`
   **When** this story starts
   **Then** the node id is resolved via `mcp__pencil` and recorded in `screen-inventory.md` **before** UI implementation (UX-DR33, NFR24)

2. **Given** an authenticated user with onboarding complete
   **When** they open `/`
   **Then** they see Inicio (eventos + cumpleaños), not a hard redirect-only bounce to `/profile` (FR52, FR53)
   **And** incomplete onboarding still redirects via the existing gate (NFR27)

3. **Given** upcoming events exist in `events`
   **When** Inicio renders
   **Then** próximos eventos are listed from real rows (read path consistent with M6 event read policy) (FR52)

4. **Given** members with `fecha_nacimiento` in range
   **When** Inicio renders
   **Then** próximos cumpleaños use story 7.1 helpers and **plantel-class visibility** — no unrestricted profiles dump (FR51, FR52, NFR26)

5. **Given** empty events or empty birthdays
   **When** Inicio renders
   **Then** empty sections are honest (no fake rows) (FR52, NFR22)

6. **Given** TabBar
   **When** this story lands
   **Then** destinations are Inicio · Plantel · Nodo · Agenda · Perfil with Inicio a real `<Link>` (no JS required), active pill works on Inicio, prior tabs do not regress (FR54, UX-DR32, NFR27)
   **And** tests that asserted four tabs are updated deliberately (ZER-67 inverse)

7. **Given** TDD
   **When** done
   **Then** failing tests first for root page behavior, birthday/event sections, TabBar five links; `pnpm test` green (NFR21)

## Tasks / Subtasks

- [x] **T0 — BLOCKING:** resolve Pencil node id for `2.1` → `zTB9C`
- [x] **T1 — Read Next 16 App Router docs** relevant to the root page / route groups
- [x] **T2 — RED** then **GREEN:** queries + UI + TabBar
- [ ] **T3 — Fidelity** at ~390px vs Pencil

## Out of scope

- PWA, 404/offline frames, dark full-app pass, push.
