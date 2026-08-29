---
story_key: 4-4-mis-aportes
linear: ZER-35
pencil_frame: WKoCd
baseline_commit: e2feb153ecb5f38ef4538c50a6261a10ae8bb9cb
---

# Story 4.4: Mis aportes list (3.4)

Status: review

<!-- Linear ZER-35. M4 plantel chrome. Data rows land in M6. -->

## Story

As a serrano,
I want a "Mis aportes" screen that matches Pencil 3.4,
so that I can open the list from my profile and see my contribution stats (even when empty).

## Acceptance Criteria

### 1. Route and navigation

**Given** I am a logged-in serrano on `/profile`
**When** I tap **Mis aportes**
**Then** I go to `/profile/aportes` under the `(app)` group
**And** the top bar shows chevron-left back to `/profile` + title exactly `Mis aportes` (`font-display text-base font-medium`)

### 2. Visual parity — Pencil `WKoCd` (chrome only)

**Given** frame `3.4 · Mis aportes`
**When** `/profile/aportes` renders
**Then** wrapper padding `[6,20,24,20]` → `pt-1.5 px-5 pb-6`, gap 16
**And** stats card: `rounded-[20px] bg-surface-inset p-4 gap-12` (two columns fill)
**And** left stat number `font-display text-2xl font-bold text-text-primary`, label `aportes en total` (`font-body text-xs text-text-muted`)
**And** right stat number `font-display text-2xl font-bold text-brand-green`, label `este mes` (`font-body text-xs text-text-muted`)
**And** list stack gap 10 (empty for now — no AporteItem rows)

### 3. No fake data (M6 deferred)

**Given** the `aportes` table does **not** exist yet (or is empty / unreachable)
**When** the page loads
**Then** stats show **0** total and **0** this month
**And** no invented list rows (no mock "Donó un proyector", etc.)
**And** empty copy: `Todavía no hay aportes.` (`font-body text-sm text-text-secondary`)
**And** do **not** create the `aportes` table, RLS, or register-aporte flow (M6)

### 4. Guards

**Given** `/profile/aportes` opened directly
**When** no session → redirect `/auth/login`
**When** tourist (or non-serrano tier) → redirect `/profile`
**And** fail closed on profile read errors → `/profile`

### 5. Out of scope

- `AporteItem` component with real data (still design-only until M6)
- Registrar aporte (4.6)
- Admin/Tesorería flows
- Linking from member detail (already has empty copy)

### 6. Tests (NFR2)

TDD. Cover: title + back link; stats 0/0; empty copy; unauthenticated redirect; tourist redirect; serrano renders.
`pnpm test`, `pnpm typecheck`, `pnpm lint` pass.

## Tasks / Subtasks

- [x] T1 — RED→GREEN: page chrome + stats 0/0 + empty copy (AC 1–3)
  - [x] `src/app/(app)/profile/aportes/page.tsx` (+ test)
  - [x] Optional presentational `MisAportesScreen` if it keeps page thin
- [x] T2 — RED→GREEN: guards (AC 4)
- [x] T3 — Wire `SerranoMenu` "Mis aportes" → `Link href="/profile/aportes"` (active styles, not muted/disabled)
- [x] T4 — Verify: targeted + full suite + typecheck + lint

## Dev Notes

### Do this / do not do this

- **Reuse** Lucide `ChevronLeft`, `Link`, existing profile auth pattern from `edit/page.tsx`.
- **Do not** invent sample aportes to match Pencil mock list.
- **Do not** query a missing `aportes` table (would 500). Hardcode empty stats until M6.
- **Do not** change TabBar / layout shell.
- Identifiers English; UI Spanish from Pencil.

### Current code

- `SerranoMenu.tsx`: "Mis aportes" is a disabled-looking `div` (opacity-40). Make it a real `Link`.
- `MemberDetail` empty aportes copy can stay as-is.
- No `aportes` in `database.types.ts` / migrations.

### Pencil

SSOT: `design/nodo-serrano.pen` frame `WKoCd`. Stats + header only for this story; list items are future.

### Stack

Next.js App Router, TS, Tailwind tokens, Vitest + Testing Library.

### References

- Linear: https://linear.app/zerrant/issue/ZER-35/m44-mis-aportes-list-34
- Milestone: `docs/roadmap/M4 · Plantel y directorio.md`
- Data deferred: `docs/roadmap/M6 · Aportes y eventos.md`

## Dev Agent Record

### Agent Model Used

grok-4.5

### Debug Log References

### Completion Notes List

- T1: `MisAportesScreen` matches Pencil WKoCd header + stats card; hard empty 0/0 (no aportes table).
- T2: page guards — login / tourist / read error → fail closed.
- T3: SerranoMenu "Mis aportes" is an active Link (no longer muted placeholder).
- T4: suite green.

### Change Log

- 2026-08-29: Implemented ZER-35 Mis aportes chrome (M6 data deferred).

### File List

- src/app/(app)/profile/aportes/page.tsx
- src/app/(app)/profile/aportes/page.test.tsx
- src/app/(app)/profile/aportes/MisAportesScreen.tsx
- src/app/(app)/profile/aportes/MisAportesScreen.test.tsx
- src/app/(app)/profile/SerranoMenu.tsx
- src/features/profile/**tests**/profile-serrano.test.tsx
- _bmad-output/implementation-artifacts/4-4-mis-aportes.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
