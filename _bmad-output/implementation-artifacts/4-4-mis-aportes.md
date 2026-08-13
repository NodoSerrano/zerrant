---
story_key: 4-4-mis-aportes
linear: ZER-35
pencil_frame: WKoCd
---

# Story 4.4: Mis aportes list (3.4)

Status: ready-for-dev

## Story

As a serrano,
I want to see my aportes list chrome,
so that M6 can fill it with real rows later.

## Acceptance Criteria

Pencil-verified: `WKoCd` (3.4 · Mis aportes).

### 1. Route `/profile/aportes`

Back + title `Mis aportes`. Stats: `{total}` / `aportes en total` and `{month}` / `este mes`.
List uses `AporteItem` visual if a component exists; otherwise a simple row (title 14 medium + meta 12 muted) matching Pencil hierarchy.

### 2. Data

If `aportes` table **does not exist yet** (M6): render stats `0` / `0` and an empty list. Do **not** create the aportes table here and do **not** fake rows.
If the table already exists: read `aportes` where `profile_id = auth.uid()`, newest first.

### 3. Out of scope

Creating aportes, events, puntos, other people’s aportes.

### 4. Tests

TDD. Renders title + zero stats when empty. Auth guard. `pnpm test` + typecheck + lint.

## Tasks

- [ ] T1 — page + empty stats
- [ ] T2 — wire real select only if table exists
- [ ] T3 — verify

## Dev Notes

M4 milestone: “Mis aportes (lista) — datos alimentados en M6”. UI now, data later. Pencil sample rows (proyector, ZK, patio, cuota) are **not** to be hardcoded.

## Dev Agent Record

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List
