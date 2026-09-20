# Story 7.5: System states — 404, offline/error, loading (`7.5`, `7.6`)

Status: backlog

## Linear

- **ZER-102** — Story 7.5: Estados 404, offline/error y loading (7.5, 7.6)
- URL: https://linear.app/zerrant/issue/ZER-102/story-75-estados-404-offlineerror-y-loading-75-76
- Branch: `juantandil123/zer-102-story-75-estados-404-offlineerror-y-loading-75-76`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Depends on: 7.2 (ZER-99); 7.4 (ZER-101) for offline coupling.

## Story

As a member,
I want designed 404, offline/error, and loading states,
so that failure modes match Pencil instead of raw framework defaults.

## Acceptance Criteria

1. **Given** frames `7.5` and `7.6` node ids are `TBD`
   **When** this story starts
   **Then** both ids are resolved via `mcp__pencil` into `screen-inventory.md` before UI implementation (UX-DR33)

2. **Given** an unknown app route
   **When** it is opened
   **Then** the designed 404 (`7.6`) renders (FR57, UX-DR31)

3. **Given** offline or recoverable error conditions owned by the app shell
   **When** they surface
   **Then** UI matches `7.5` key IA/copy (FR58, UX-DR30)

4. **Given** Inicio primary fetches
   **When** loading
   **Then** skeleton/loading treatment exists (not a blank flash only) (FR58)

5. **Given** TDD
   **When** done
   **Then** tests cover not-found render and loading/empty branches as applicable; `pnpm test` green (NFR21)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING:** resolve Pencil node ids for `7.5` and `7.6` into screen-inventory
- [ ] **T1 — RED:** not-found route test + loading/skeleton branches for Inicio fetches
- [ ] **T2 — GREEN:** `not-found` UI, offline/error surface, loading treatment
- [ ] **T3 — Fidelity** ~390px vs Pencil

## Out of scope

- Redesigning every historical empty state (7.1–7.4 already owned by earlier milestones).
