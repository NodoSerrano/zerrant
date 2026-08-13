---
story_key: 4-2-member-detail
linear: ZER-33
pencil_frame: G65Dnv
---

# Story 4.2: Detalle de miembro (3.1)

Status: ready-for-dev

Depends on: ZER-32 (`/plantel`, MemberCard href).

## Story

As a serrano,
I want to open a member’s profile,
so that I can see their roles, skills, rate (if public), and bio.

## Acceptance Criteria

Pencil-verified texts from `G65Dnv` (3.1 · Detalle de miembro).

### 1. Route `/plantel/[id]`

Back control label `Perfil` → `/plantel`. Identity: Avatar, `displayName`, TierBadge, disponibilidad. Sections in order:

- `Rol en el nodo` — confirmed RoleChips only
- `Aportes` + `Ver todos` — preview list **or** empty; real rows come in M6. `Ver todos` → `/profile/aportes` only when viewing **self**; otherwise hide or no-op until a public aportes route exists. Do not fake M6 data.
- `Proyectos` + `Ver todos` — placeholder empty until M5. Do not invent project cards.
- `Habilidades` — skill chips. If self, this block can link to `/profile/habilidades` (ZER-34).
- Rate: show `USD {n} / hora` only when `visibilidad_tarifa = 'publica'` **or** viewer is self. Never leak private rate.
- `Sobre mí` — `profiles.bio`
- CTA `Enviar mensaje` — if `contacto_telegram` set, `href` to `https://t.me/{handle}`; else hide or disable. Do not invent in-app chat (backlog).

### 2. Guards

No session → login. Missing profile → `/plantel`. Tourist profiles are not addressable (redirect `/plantel`).

### 3. Out of scope

Edit skills form, aportes CRUD, projects CRUD, in-app chat.

### 4. Tests

TDD. Public vs private rate. Tourist id rejected. Telegram link. `pnpm test` + typecheck + lint.

## Tasks

- [ ] T1 — page + tests
- [ ] T2 — rate visibility + telegram
- [ ] T3 — verify

## Dev Notes

Reuse Avatar, TierBadge, RoleChip, displayName. Pencil sample copy is **fixture text** (Nóbel Dam, USD 45) — render **real** profile fields.

## Dev Agent Record

### Completion Notes List

Ultimate context engine analysis completed - comprehensive developer guide created

### File List
