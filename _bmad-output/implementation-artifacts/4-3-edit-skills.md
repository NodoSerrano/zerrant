---
story_key: 4-3-edit-skills
linear: ZER-34
pencil_frame: sYaBa
---

# Story 4.3: Editar habilidades (3.3)

Status: ready-for-dev

Depends on: ZER-32 (`skills` / `profile_skills`).

## Story

As a serrano,
I want to add and remove skill tags,
so that the plantel can find me by what I do.

## Acceptance Criteria

Pencil-verified: `sYaBa` (3.3 · Editar habilidades).

### 1. Route `/profile/habilidades`

Chrome: back + title `Habilidades` + `Guardar` (15 / 600).
Title `Tus habilidades` (24 bold). Subtitle exact: `Agregá tags. Te sugerimos los que ya usa la comunidad.`
Input placeholder exact: `Agregar habilidad...`
Selected tags removable. `Sugerencias` row: skills from catalog not already selected (Pencil examples: Rust, ZK Proofs, DevOps, Matemática, Ciberseguridad — use **real catalog**, not hardcoded demo if catalog differs).

### 2. Save

Persist `profile_skills` for the current user. Normalize new tags (trim, case-fold uniqueness). Creating a skill that does not exist yet: allowed if you insert into `skills` then link — or only allow catalog picks. Prefer: pick from catalog **or** create if no match (normalized). RLS must allow owner writes.

Tourist: redirect `/profile` (no skills editor).

### 3. Out of scope

Plantel filters consuming the new tags beyond ZER-32. Member detail link can land here from ZER-33.

### 4. Tests

TDD. Add/remove, save, tourist redirect. `pnpm test` + typecheck + lint.

## Tasks

- [ ] T1 — page UI + tests
- [ ] T2 — save action
- [ ] T3 — verify

## Dev Notes

Pencil labels: `Habilidades`, `Guardar`, `Tus habilidades`, `Agregar habilidad...`, `Sugerencias`. Identifiers English.

## Dev Agent Record

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List
