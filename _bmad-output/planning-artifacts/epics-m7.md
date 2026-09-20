---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: ready-for-development
inputDocuments:
  - _bmad-output/specs/spec-m7-cumpleanos-pwa-pulido/SPEC.md
  - _bmad-output/specs/spec-m7-cumpleanos-pwa-pulido/screen-inventory.md
  - _bmad-output/specs/spec-m7-cumpleanos-pwa-pulido/data-model.md
  - docs/roadmap/M7 · Cumpleaños, PWA y pulido.md
  - docs/roadmap/Stack técnico.md
  - docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md
  - docs/roadmap/STATUS.md
  - design/nodo-serrano.pen
---

# nodo - Epic Breakdown (M7 · Cumpleaños, PWA y pulido)

## Overview

Complete epic and story breakdown for milestone **M7 · Cumpleaños, PWA y pulido**, closing the MVP.

**Numbering:** Continues from `epics-m5-m6.md` which ended at **FR50**, **NFR20**, **UX-DR28**. This file starts at **FR51**, **NFR21**, **UX-DR29**. Epic number **7** matches the milestone.

**Prerequisite:** Pencil node ids for M7 frames start as `TBD`. Each UI story resolves its frame via `mcp__pencil` before implementation. `design/nodo-serrano.pen` is encrypted — never filesystem-read.

**Story file status convention:** like M5/M6, new story files keep `Status: backlog` in the header and `development_status: backlog` even though the BMad glossary also defines `ready-for-dev` as “story file created.” Ticketization parity is backlog until a human starts the story.

**Implementation gate:** Inicio (story 7.2) needs `events` readable (M6). Ticketization can land while last M5/M6 PRs merge; do not start 7.2 against a branch without events.

## Requirements Inventory

### Functional Requirements

FR51: Pure helpers compute **age** and **upcoming birthdays** from `profiles.fecha_nacimiento` (window default 30 days unless Pencil fixes a count); nulls excluded; leap-day policy tested; no new table.
FR52: Inicio (`2.1`) shows **próximos eventos** (from `events`) and **próximos cumpleaños** (from FR51) with honest empty states; matches Pencil at ~390px.
FR53: Completed-onboarding authenticated users land on Inicio at `/` (or the resolved Inicio path) instead of a hard redirect-only-to-`/profile` dead end; onboarding gate still redirects incomplete profiles.
FR54: TabBar restores **Inicio** as a fifth real link destination (Inicio · Plantel · Nodo · Agenda · Perfil); no-JS navigation works; active state works; ZER-67 honesty is preserved because the destination is real.
FR55: Web app **manifest** + **icons** make the app installable (standalone/minimal-ui, themed colors, non-404 icons).
FR56: **Service worker** offline shell (Serwist preferred) opens the shell offline after a prior online visit; does not fake a private offline member graph.
FR57: Designed **404** (`7.6`) for unknown routes.
FR58: Designed **offline/error** (`7.5`) and loading/skeleton treatment for Inicio primary fetches.
FR59: **Dark-mode polish** pass on primary shells using existing tokens — fix hard-coded light-only colors and contrast breaks; no new palette.
FR60: Bounded **a11y + performance** pass on M7 surfaces (keyboard, alt/sizes, LCP/CLS foot-guns from M7).
FR61: M7 DoD demonstrated on staging: installable PWA opens offline shell; Inicio shows upcoming birthdays correctly.

### NonFunctional Requirements

NFR21: TDD mandatory (Vitest + Testing Library); `pnpm test` green before done.
NFR22: Production-ready bar — no fake birthdays, no broken manifest icons, no "fix later" inside scope.
NFR23: Next 16 docs under `node_modules/next/dist/docs/` consulted before PWA/metadata wiring.
NFR24: `design/nodo-serrano.pen` is SSOT; encrypted; `mcp__pencil` only.
NFR25: Code identifiers English; UI Spanish per Pencil.
NFR26: Birthday visibility reuses plantel-class profile visibility — no unrestricted profiles dump on Inicio.
NFR27: No regression in auth, onboarding, plantel, tasks, projects, aportes, agenda when TabBar/root change.
NFR28: PWA caching policy is explicit in the SW story PR (what is cached vs network-only).

### UX Design Requirements

UX-DR29: Inicio IA per frame `2.1 · Inicio` (eventos + cumpleaños).
UX-DR30: Offline/error per frame `7.5 · Offline / error`.
UX-DR31: 404 per frame `7.6 · 404`.
UX-DR32: TabBar five-destination IA per PRD (Inicio first).
UX-DR33: Node ids start `TBD`; resolve via `mcp__pencil` before UI implementation.
UX-DR34: Acceptance — Pencil vs live ~390px; PWA install + offline evidence on QA story.

### FR Coverage Map

FR51: Story 7.1
FR52–FR54: Story 7.2
FR55: Story 7.3
FR56: Story 7.4
FR57–FR58: Story 7.5
FR59: Story 7.6
FR60: Story 7.7
FR61: Story 7.8

## Epic 7 — Cumpleaños, PWA y pulido

Close the MVP: home dashboard, installable offline-capable shell, system states, dark + a11y polish.

### Story 7.1 — Birthday domain helpers (age + upcoming)

As a member,
I want age and upcoming birthdays computed correctly from `fecha_nacimiento`,
so that Inicio can show real cumpleaños without a new table.

**Depends on:** none (pure lib).  
**Linear placeholder title:** Story 7.1 — Helpers de cumpleaños (edad + próximos)

### Story 7.2 — Inicio hub + TabBar Inicio (`2.1`)

As a member,
I want an Inicio dashboard with upcoming events and birthdays and a real Inicio tab,
so that `/` stops being a redirect-only dead end and the fifth tab is honest again.

**Depends on:** 7.1; M6 `events` readable on the branch.  
**Frames:** `2.1`  
**Linear:** Story 7.2 — Inicio (2.1) eventos + cumpleaños y TabBar

### Story 7.3 — PWA manifest + icons

As a member,
I want to install the app from the browser,
so that Nodo lives on my home screen.

**Depends on:** none strictly; preferably after 7.2 so start_url matches Inicio.  
**Linear:** Story 7.3 — PWA manifest e íconos

### Story 7.4 — Offline shell (Serwist / SW)

As a member on flaky mountain connectivity,
I want the app shell to open offline after I have visited online,
so that I am not dropped on the browser's generic offline page.

**Depends on:** 7.3.  
**Linear:** Story 7.4 — Service worker shell offline

### Story 7.5 — System states (`7.5`, `7.6`) + loading

As a member,
I want designed 404, offline/error, and loading states,
so that dead ends match the product, not the framework default.

**Depends on:** 7.4 for offline coupling; 404 can proceed in parallel after 7.2.  
**Frames:** `7.5`, `7.6`  
**Linear:** Story 7.5 — Estados 404, offline/error y loading

### Story 7.6 — Dark mode polish pass

As a member using dark mode,
I want primary shells to remain readable and on-token,
so that dark is a first-class theme, not an afterthought.

**Depends on:** 7.2 and 7.5 screens exist to polish.  
**Linear:** Story 7.6 — Pulido modo oscuro

### Story 7.7 — A11y + performance pass

As a member,
I want Inicio and system states to be keyboard-reachable and free of M7-induced CWV foot-guns,
so that the MVP close includes a basic quality bar.

**Depends on:** 7.2–7.5.  
**Linear:** Story 7.7 — Pasada a11y y performance

### Story 7.8 — QA DoD M7 e2e on staging

As the product owner,
I want the M7 Done criteria demonstrated on staging,
so that the MVP closes on evidence.

**Depends on:** 7.1–7.7.  
**Linear:** Story 7.8 — QA DoD de M7 end-to-end en staging
