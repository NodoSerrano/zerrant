# Story 7.1: Birthday domain helpers (age + upcoming)

Status: backlog

## Linear

- **ZER-98** — Story 7.1: Helpers de cumpleaños (edad + próximos)
- URL: https://linear.app/zerrant/issue/ZER-98/story-71-helpers-de-cumpleanos-edad-proximos
- Branch: `juantandil123/zer-98-story-71-helpers-de-cumpleanos-edad-proximos`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Unblocks Inicio birthday section (story 7.2 / ZER-99).
- Depends on: nothing (pure lib).

## Story

As a member,
I want age and upcoming birthdays computed from `fecha_nacimiento`,
so that Inicio can list real cumpleaños without a new table.

## Acceptance Criteria

1. **Given** a `fecha_nacimiento` date string (`YYYY-MM-DD`)
   **When** age is computed for a fixed "today"
   **Then** the helper returns the correct integer age (FR51, NFR21)

2. **Given** a list of profiles with `fecha_nacimiento` and display-name fields
   **When** upcoming birthdays are requested for a window (default 30 days inclusive)
   **Then** results are sorted by next occurrence ascending, exclude null birthdays, and include "today" (FR51)

3. **Given** a Feb 29 birthday
   **When** the current year is not a leap year
   **Then** the leap-day policy is explicit and tested (document Feb 28 **or** Mar 1 — pick one, do not crash) (FR51)

4. **Given** TDD is mandatory
   **When** the story is claimed done
   **Then** pure unit tests were written first; `pnpm test` green (NFR21)

## Tasks / Subtasks

- [ ] **T1 — RED:** age + upcoming + leap-day + null exclusion tests
- [ ] **T2 — GREEN:** implement pure module under `src/features/` (e.g. `home/birthdays.ts` or `profile/birthdays.ts`)
- [ ] **T3 — Docs:** one short comment on timezone/date-only strategy (prefer date-only UTC or America/Argentina/Buenos_Aires — pick one)

## Out of scope

- UI, queries, RLS, PWA, push reminders.
