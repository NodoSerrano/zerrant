---
story_key: 5-1-projects-schema-and-rls
linear: ZER-41
pencil_frame: null
baseline_commit: null
---

# Story 5.1: Projects schema + RLS (M5 foundation)

Status: ready-for-dev

<!-- Linear ZER-41. First M5 story. No UI screens. Unblocks hub / create / detail / join. -->

## Story

As a platform engineer,
I want `projects` and `project_members` tables with enums, RLS, and PostgREST grants,
so that later M5 UI stories can create, list, join, and administer community projects safely.

## Acceptance Criteria

### 1. Tables and enums (PRD §6)

**Given** a fresh or existing Supabase DB
**When** migration `YYYYMMDDHHMMSS_projects.sql` is applied
**Then** it creates enums (if not exists):

| Enum                    | Values                                     | Default usage                                |
| ----------------------- | ------------------------------------------ | -------------------------------------------- |
| `project_estado`        | `idea`, `en_curso`, `pausado`, `terminado` | `projects.estado` default `idea`             |
| `project_ingreso`       | `abierto`, `aprobacion`                    | `projects.ingreso` default `aprobacion`      |
| `project_member_rol`    | `miembro`, `admin`                         | `project_members.rol` default `miembro`      |
| `project_member_estado` | `pendiente`, `aprobado`                    | `project_members.estado` default `pendiente` |

**And** table `public.projects`:

| Column        | Type                                                | Notes                |
| ------------- | --------------------------------------------------- | -------------------- |
| `id`          | `uuid` PK                                           | `gen_random_uuid()`  |
| `nombre`      | `text not null`                                     |                      |
| `descripcion` | `text`                                              | nullable             |
| `estado`      | `project_estado not null`                           | default `idea`       |
| `ingreso`     | `project_ingreso not null`                          | default `aprobacion` |
| `creado_por`  | `uuid not null` → `profiles(id)` ON DELETE RESTRICT | creator              |
| `created_at`  | `timestamptz not null`                              | default `now()`      |

**And** table `public.project_members`:

| Column       | Type                                               | Notes               |
| ------------ | -------------------------------------------------- | ------------------- |
| `project_id` | `uuid not null` → `projects(id)` ON DELETE CASCADE |                     |
| `profile_id` | `uuid not null` → `profiles(id)` ON DELETE CASCADE |                     |
| `rol`        | `project_member_rol not null`                      | default `miembro`   |
| `estado`     | `project_member_estado not null`                   | default `pendiente` |
| `created_at` | `timestamptz not null`                             | default `now()`     |
| PK           | `(project_id, profile_id)`                         | composite           |

**And** indexes: `project_members(profile_id)`, `project_members(project_id)`, `projects(estado)`, `projects(creado_por)`.

[Source: `docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` §6; `docs/roadmap/Modelo de datos.md`; `docs/roadmap/M5 · Proyectos.md`]

### 2. RLS — principles (no recursion)

**Given** RLS enabled on both tables
**When** policies are evaluated
**Then** they follow:

| Action                       | Who                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **SELECT** `projects`        | any authenticated user                                                                                                     |
| **INSERT** `projects`        | authenticated **and** `profiles.tier <> 'tourist'` (serrano) **and** `creado_por = auth.uid()`                             |
| **UPDATE** `projects`        | project **admin** (`project_members` row: same project, `rol = 'admin'`, `estado = 'aprobado'`) **or** `is_platform_admin` |
| **DELETE** `projects`        | project admin or platform admin (same as update)                                                                           |
| **SELECT** `project_members` | authenticated                                                                                                              |
| **INSERT** `project_members` | (a) self-join: `profile_id = auth.uid()` and caller is serrano; (b) project admin adding members; (c) platform admin       |
| **UPDATE** `project_members` | project admin or platform admin (approve/reject, change `rol`)                                                             |
| **DELETE** `project_members` | project admin, platform admin, or self-leave (`profile_id = auth.uid()`)                                                   |

**And** join semantics are **not** enforced only in the UI: document in migration comments that app/RPC will set:

- `ingreso = 'abierto'` → insert member with `estado = 'aprobado'`
- `ingreso = 'aprobacion'` → insert with `estado = 'pendiente'`

(A later story may add a `join_project` RPC; **out of scope here** unless needed to avoid chicken-egg on first admin.)

**Chicken-egg (creator admin):** on project insert, a **trigger** `AFTER INSERT ON projects` inserts `project_members (project_id, profile_id=creado_por, rol='admin', estado='aprobado')` so the creator is admin without a separate privileged insert path that bypasses RLS incorrectly.

**Recursion guard (ZER-38 lesson):** do **not** write policies that subquery the same table under RLS in a way that re-enters infinitely. Prefer a `SECURITY DEFINER` helper, e.g. `public.is_project_admin(p_project_id uuid) returns boolean`, `set search_path = public`, that reads `project_members` with definer rights and checks `auth.uid()`. Reuse the pattern from `20260821223400_fix_rls_recursion_profiles.sql` / membership admin helpers if present.

[Source: `docs/roadmap/Seguridad RLS.md`; PRD §6 security bullets; ZER-38]

### 3. Grants (PostgREST)

**Given** authenticated role talks to PostgREST
**When** grants are applied
**Then** (mirror skills / membership migrations — avoid bare table without grants → `42501`):

- `grant select on public.projects to authenticated`
- `grant insert (nombre, descripcion, estado, ingreso, creado_por) on public.projects to authenticated` (or full insert if column list is awkward — prefer explicit columns)
- `grant update (nombre, descripcion, estado, ingreso) on public.projects to authenticated`
- `grant delete on public.projects to authenticated`
- `grant select on public.project_members to authenticated`
- `grant insert (project_id, profile_id, rol, estado) on public.project_members to authenticated`
- `grant update (rol, estado) on public.project_members to authenticated`
- `grant delete on public.project_members to authenticated`

RLS still decides who succeeds.

Also grant `execute` on any `SECURITY DEFINER` helpers to `authenticated` if used by policies.

[Source: `supabase/migrations/20260815120000_skills_profile_skills.sql`; `20260725033000_grants_authenticated.sql`; ZER-37]

### 4. TypeScript types

**Given** `src/lib/supabase/database.types.ts`
**When** the story is done
**Then** `projects` and `project_members` (and new enums under `Enums` / `CompositeTypes` as the file’s convention requires) are present **once** (no duplicate keys — main already had a `roles`/`profile_roles` dup incident)
**And** `pnpm typecheck` passes

### 5. Out of scope (explicit)

- UI: `/nodo/proyectos`, ProjectCard, create form, detail, join buttons (stories 5.2+)
- Wiring the Nodo segmented control “Proyectos” tab (still placeholder span today)
- Changing `SerranoMenu` “Mis proyectos”
- Seed sample projects
- `join_project` / `approve_project_member` RPCs (optional follow-up if policies alone are insufficient for edge cases)
- Linking tasks ↔ projects

### 6. Tests (NFR2)

TDD where feasible without a live DB:

- **Unit/policy-intent tests optional**; minimum: migration file exists and is valid SQL structure reviewed in PR
- If the repo has a pattern for SQL/RLS tests, follow it; otherwise document manual verify checklist:
  - tourist cannot insert project
  - serrano can insert project and becomes admin via trigger
  - second serrano can select the project
  - non-admin cannot update project config
  - admin can update member `estado` pendiente → aprobado
- `pnpm test`, `pnpm typecheck`, `pnpm lint` pass (types only change expected)

## Tasks / Subtasks

- [ ] T1 — Write migration `supabase/migrations/…_projects.sql` (enums, tables, indexes, trigger creator→admin)
- [ ] T2 — RLS policies + `is_project_admin` (or equivalent) without recursion
- [ ] T3 — Grants for `authenticated`
- [ ] T4 — Update `database.types.ts` (single definitions)
- [ ] T5 — Verify typecheck + full test suite; note manual RLS smoke steps in Dev Agent Record

## Dev Notes

### Do this / do not do this

- **Copy structure** from `20260815120000_skills_profile_skills.sql` and `20260728190000_membership_roles.sql` (comments in Spanish OK if existing migrations do; **new app/UI code stays English identifiers**).
- **Do not** invent columns beyond PRD (no `puntos`, no budget fields — Backlog).
- **Do not** ship UI in this story.
- **Do not** use recursive RLS patterns that query `project_members` from a policy on `project_members` without definer helper.
- Creator trigger must run as definer or use a path that bypasses RLS for the bootstrap admin row only.

### Current code to know

- Nodo hub: `src/app/(app)/nodo/tasks/page.tsx` — “Proyectos” is a **disabled span** (tests assert no link). Next UI story will add `/nodo/proyectos` and flip the segment.
- No `projects` in types or migrations today.
- Profile “Mis proyectos” in `SerranoMenu` is still muted placeholder (like aportes was before ZER-35).

### Suggested follow-up story order (for Linear later)

1. **5.2** — Nodo Proyectos hub + empty state (Pencil `2.4` / `7.3` `K3qRs` / `wzIj2`) + segment link
2. **5.3** — Crear proyecto (Pencil `4.4`)
3. **5.4** — Detalle + unirse (Pencil `4.3`)
4. **5.5** — Solicitudes de ingreso admin (Pencil `4.5`)
5. **5.6** — Mis proyectos on profile (optional)

### Stack

Next.js App Router, Supabase Postgres RLS, Vitest. Identifiers English; domain Spanish labels later in UI.

### References

- Linear: https://linear.app/zerrant/issue/ZER-41/m51-projects-schema-rls-foundation
- Milestone: `docs/roadmap/M5 · Proyectos.md`
- Schema: `docs/roadmap/Modelo de datos.md`
- RLS: `docs/roadmap/Seguridad RLS.md`
- PRD: `docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` §6
- Pattern: `supabase/migrations/20260815120000_skills_profile_skills.sql`
- Recursion fix: `supabase/migrations/20260821223400_fix_rls_recursion_profiles.sql`
- Grants lesson: ZER-37

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

- 2026-08-29: Story drafted (create-story) — M5 foundation schema + RLS. Linked Linear ZER-41.

### File List
