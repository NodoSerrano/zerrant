---
id: SPEC-m5-proyectos
companions:
  - screen-inventory.md
  - data-model.md
  - ../../design/nodo-serrano.pen
  - ../../docs/roadmap/M5 · Proyectos.md
  - ../../docs/roadmap/Seguridad RLS.md
  - ../../docs/roadmap/Glosario.md
  - ../../docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# M5 · Proyectos

## Why

**Pain:** The node has community initiatives but no place to hold them. Today "Proyectos" exists only as dead chrome: an inert `<span>` in the Nodo hub segmented control, a greyed-out "Mis proyectos" row in the serrano profile menu, and a hardcoded "Todavía no hay proyectos." line in member detail. There is no `projects` table, so nothing can be created, joined, or governed.

**Mandate now:** M5 turns that chrome into a real group-style primitive — a project any serrano can create, with two membership doors (`abierto` = join immediately, `aprobacion` = request and wait) and per-project admins who hold the gate. Goal is **production**: real tables, real RLS, real screens. No placeholder rows survive this milestone.

## Capabilities

- **CAP-1**
  - **intent:** `projects` and `project_members` exist in Postgres with the PRD enums, RLS enabled, and authenticated table privileges verified, so every later capability reads and writes real rows under real policy.
  - **success:** A migration creates both tables with `estado` (`idea/en_curso/pausado/terminado`), `ingreso` (`abierto/aprobacion`), `project_members.rol` (`miembro/admin`), and `project_members.estado` (`pendiente/aprobado`); `alter table … enable row level security` plus explicit policies ship in the same migration; `pnpm db:check-grants` passes (CI job `db grants (authenticated)`); a policy test proves a non-member cannot mutate project config and a project admin can.

- **CAP-2**
  - **intent:** The Nodo hub exposes a working Proyectos sub-tab (`2.4`) with a designed empty state (`7.3`), replacing the dead segmented-control span.
  - **success:** The Proyectos control in `src/app/(app)/nodo/tasks/page.tsx` navigates to a real route instead of rendering an inert `<span className="… cursor-default">`; the projects list renders project rows/cards from `projects`; with zero visible projects the screen matches frame `7.3 · Vacío Proyectos`; the Tareas/Proyectos control keeps its active-state treatment on both routes.

- **CAP-3**
  - **intent:** Any serrano can create a project (`4.4`) with nombre, descripcion, `estado`, and `ingreso`, and is seated as its first admin.
  - **success:** The create form submits nombre, descripcion, `estado` and `ingreso` selectors using the PRD enum values; on success a `projects` row is inserted with `creado_por` = the author and a `project_members` row for the author with `rol='admin'` and `estado='aprobado'`; tourists cannot reach or submit the form (blocked by RLS, not only by UI); the new project is immediately visible in the Proyectos list.

- **CAP-4**
  - **intent:** Project detail (`4.3`) shows estado, approved miembros, and admins, with the correct join affordance for the viewer.
  - **success:** Detail renders nombre, descripcion, `estado`, the approved member list, and which of them are admins; only `estado='aprobado'` members count as part of the project; the primary affordance is "Unirse" for an `ingreso='abierto'` project, "Solicitar ingreso" for `aprobacion`, a pending indicator for a viewer with a `pendiente` row, and no join affordance for an existing approved member.

- **CAP-5**
  - **intent:** Joining a project follows the `ingreso` door defined on the project, enforced in the database.
  - **success:** Joining an `ingreso='abierto'` project writes `project_members` with `estado='aprobado'` and the viewer appears in the member list without any admin action; joining an `ingreso='aprobacion'` project writes `estado='pendiente'`, the viewer does not appear as a member, and the row lands in that project's request queue; a client attempting to self-insert `estado='aprobado'` into an `aprobacion` project is rejected by policy, not only by the server action.

- **CAP-6**
  - **intent:** Project admins govern the project: they work the join-request queue (`4.5`) and designate further admins.
  - **success:** A project admin sees `estado='pendiente'` rows for their project in a queue screen and can approve (→ `aprobado`) or reject (row removed/denied); approving makes the person appear in the detail member list; a project admin can promote an approved member to `rol='admin'`; a non-admin of that project can do none of this, enforced by RLS; a platform admin's global powers are not silently assumed to include per-project governance unless a policy grants it explicitly.

- **CAP-7**
  - **intent:** A person's projects are visible where identity lives: the serrano profile menu and plantel member detail.
  - **success:** The greyed "Mis proyectos" row in `src/app/(app)/profile/SerranoMenu.tsx` becomes an enabled row with a real count and destination; the "Proyectos" section in `src/features/plantel/MemberDetail.tsx` lists that member's approved projects instead of the hardcoded "Todavía no hay proyectos." line; `src/features/plantel/MemberDetail.test.tsx` is updated so the placeholder assertion no longer pins the old behavior; only `aprobado` memberships are listed.

## Constraints

- **SSOT UI:** `design/nodo-serrano.pen` is the only visual source of truth. Node ids for M5 frames are **not yet resolved** — each must be fetched through the `mcp__pencil` tools before its UI story is implemented (see `screen-inventory.md`). Never open the `.pen` file with `Read`/`rg`; it is encrypted.
- **DB-first authorization:** Every rule in this SPEC is enforced by RLS policies in a migration. Server actions may add ergonomics, never the only guard.
- **Grants before policies:** New tables inherit DML from the ZER-49 default privileges, but RLS and policies must still be enabled explicitly per table. `pnpm db:check-grants` must pass. See the "Grants vs RLS" section in `data-model.md`.
- **Enum fidelity:** Domain enum values stay in Spanish exactly as the PRD writes them (`idea`, `en_curso`, `pausado`, `terminado`, `abierto`, `aprobacion`, `miembro`, `admin`, `pendiente`, `aprobado`). Code identifiers stay in English; user-facing copy stays in Spanish as in Pencil.
- **Production-ready bar:** No stubbed backends, no fake counts, no "fix later" inside in-scope work. A screen is done only when it reads and writes real rows under real policy.
- **Engineering rules:** TDD (Vitest + Testing Library) — failing test first, then implementation. `pnpm test` green before any story is claimed done.
- **Reuse the DS:** Compose from the primitives delivered by `SPEC-ui-fidelity-m0-m2` (Avatar, Chip, PrimaryButton, SecondaryButton, Input, TierBadge, RoleChip). A ProjectCard, if a frame needs one, is built as a shared component, not page-local CSS.
- **Behavior preserve:** Auth, onboarding, profile, plantel, and tasks behavior must not regress. The Tareas half of the Nodo hub keeps working exactly as shipped.
- **Build order:** schema + RLS (CAP-1) → list + empty (CAP-2) → create (CAP-3) → detail (CAP-4) → join (CAP-5) → governance (CAP-6) → identity surfaces (CAP-7).

## Non-goals

These are **parked decisions**, recorded in `docs/roadmap/Backlog.md`, whose header reads _"No borrar: son decisiones tomadas de posponer"_. Do not implement, scaffold, or leave hooks for them.

- **Puntos Serrano** — gamification, valuation matrix, monthly thresholds. Parked.
- **Project budgets / invoicing** (`Presupuestos / facturación de proyectos`). Parked.
- **On-chain payments.** Parked.
- **Push notifications** (e.g. notifying a requester that their join was approved). Parked.
- Anything in **M6** (aportes, events, agenda, RSVP) or **M7** (cumpleaños, PWA, pulido).
- Project-level chat, files, or task attachment (`tasks` are not linked to `projects` in this milestone).
- Leaving a project, deleting a project, or demoting an admin — not in the M5 scope bullets; if a frame implies one, raise it rather than inventing the rule.

## Success signal

The milestone DoD from `docs/roadmap/M5 · Proyectos.md`, verbatim:

> - Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba.
> - En un proyecto abierto, unirse es inmediato.

Demonstrated end-to-end on staging with two real accounts, against the real tables under RLS. In addition: the Nodo hub's Proyectos control, the profile "Mis proyectos" row, and the member-detail "Proyectos" section all show real data — no dead chrome from M0–M2 remains in the projects surface.

## Assumptions

- **Node ids are unresolved.** The Pencil app was not running when this SPEC was written, so `screen-inventory.md` carries `TBD` for every node id. Resolving them via `mcp__pencil` is a prerequisite of each UI story, not an afterthought.
- **Creator is the first admin.** The PRD says "El creador es admin del proyecto"; this contract reads that as an automatic `project_members` row with `rol='admin'`, `estado='aprobado'` written in the same transaction as the project.
- **"Admins de ese proyecto"** in `docs/roadmap/Seguridad RLS.md` means `project_members.rol='admin'` scoped to that `project_id` — not `profiles.is_platform_admin`. Any additional platform-admin override must be written explicitly into a policy.
- **Read scope:** `docs/roadmap/Seguridad RLS.md` gives no read rule for `projects`/`project_members`; this contract assumes read for any authenticated user, consistent with the `events` rule ("lee autenticado"). Tourists can therefore see projects but cannot create or join.
- **Rejection semantics:** rejecting a join request removes the `pendiente` row (the person may request again) rather than introducing a third `estado` value — the PRD enum has exactly two values.
- **Projects list scope:** the Proyectos sub-tab lists all visible projects, not only the viewer's; "Mis proyectos" on the profile is the personal cut.
- **The `tasks` ↔ `projects` relation does not exist** in the PRD data model. Projects do not own tasks in M5.
