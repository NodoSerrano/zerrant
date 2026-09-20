# Story 7.6: Dark mode polish pass

Status: backlog

## Linear

- **ZER-103** — Story 7.6: Pulido modo oscuro
- URL: https://linear.app/zerrant/issue/ZER-103/story-76-pulido-modo-oscuro
- Branch: `juantandil123/zer-103-story-76-pulido-modo-oscuro`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Depends on: 7.2 (ZER-99) and 7.5 (ZER-102) screens exist to polish.

## Story

As a member using dark mode,
I want primary shells to stay on-token and readable,
so that dark is first-class for the MVP close.

## Acceptance Criteria

1. **Given** existing tokens from story 1.1 / `.dark`
   **When** this pass runs
   **Then** no new palette is invented (FR59)

2. **Given** a checklist of primary shells (auth, onboarding, plantel, nodo, agenda, profile, admin, Inicio, system states)
   **When** each is reviewed under `.dark`
   **Then** hard-coded light-only colors, unreadable contrast, and broken surfaces found in-scope are fixed (FR59)

3. **Given** the PR
   **When** it lands
   **Then** the checklist + screenshots (or explicit "clean" marks) live in the PR/Linear evidence (NFR22)

4. **Given** tests
   **When** a fix is code-level (class/token misuse)
   **Then** lock it with a unit/dom test where practical (NFR21)

## Tasks / Subtasks

- [ ] **T1 — Checklist** primary shells under `.dark` (auth, onboarding, plantel, nodo, agenda, profile, admin, Inicio, system states)
- [ ] **T2 — Fix** hard-coded light-only colors / contrast breaks found in-scope (tokens only)
- [ ] **T3 — Evidence** screenshots or clean marks on PR/Linear

## Out of scope

- Pixel-perfect every historical screen beyond the checklist. Rebuilding the design system.
