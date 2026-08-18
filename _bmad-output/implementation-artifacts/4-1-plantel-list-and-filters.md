# Story 4.1: Plantel list + filters (2.2 / 7.1)

Status: review

Linear: [ZER-32](https://linear.app/zerrant/issue/ZER-32/m41-plantel-list-filters-22-71) · Branch: `estudionomade2025/zer-32-m41-plantel-list-filters-22-71`

## Story

As a member browsing the community directory,
I want the plantel screen to list serranos with search and filters by role, skill and availability,
so that I can find who I need and tap into their profile.

## Acceptance Criteria

1. **Given** an authenticated user opens `/plantel`
   **When** the page renders on the server
   **Then** the list contains only serranos — every `profiles` row read for this screen is filtered by `tier <> 'tourist'` (both in the query and enforced by RLS, see AC2)
   **And** an unauthenticated user is redirected to `/auth/login`
   **(FR26, NFR1)**

2. **Given** the data model
   **When** the migration `skills_profile_skills` is applied
   **Then** it creates `public.skills` (`id uuid pk`, `nombre text not null unique`, `created_at`) and `public.profile_skills` (`id uuid pk`, `profile_id → profiles`, `skill_id → skills`, `unique(profile_id, skill_id)`, `created_at`) with indexes on the FK columns
   **And** it adds RLS: `skills` readable by any authenticated user, writable only by admins; `profile_skills` readable by authenticated users for serrano profiles, and self-managed (insert/delete own) by serranos
   **And** it adds a `profiles` SELECT policy `"Anyone can read serrano profiles"` using `tier <> 'tourist'` so tourists never appear in the plantel while admins keep their all-access policy and users keep reading their own row
   **And** it adds a `profile_roles` SELECT policy `"Anyone can read serrano profile roles"` (the role chips and the "Por rol" filter need other serranos' roles, which M3's "own roles / admins" policies do not expose)
   **And** it adds PostgREST column/table grants for `skills` and `profile_skills` (`select` for authenticated; `insert`/`delete` scoped to the self-managed columns)
   **(NFR1)**

3. **Given** the plantel header
   **When** rendered
   **Then** it shows "Plantel" (`font-display`, 24, 700, `text-text-primary`) and below it `{n} serranos en la comunidad` (`font-body`, 13, `text-text-secondary`) where `n` is the **total** serrano count independent of the active filters
   **(FR24)**

4. **Given** the search field
   **When** rendered
   **Then** it is an `<input>` (accessible name "Buscar por nombre o skill") with a lucide `search` icon (18×18, `text-text-muted`), placeholder "Buscar por nombre o skill", `h-12 rounded-2xl bg-surface border border-border px-4`
   **And** typing filters the list by visible name (`nombre_visible`-derived), `nombre`, `apellido`, `apodo` **or** any skill name, case-insensitive substring match
   **And** when it has a value a lucide `x` clear button (18×18, `text-text-muted`) appears and empties the input
   **(FR24, FR25)**

5. **Given** the filter chips row
   **When** rendered
   **Then** it shows four pills in order: "Todos", "Disponibles", "Por rol", "Por skill"
   **And** each pill is `rounded-pill px-[14px] py-2 font-display text-[13px] font-medium`; the active pill is `bg-primary text-on-primary` (no border), an inactive pill is `bg-surface border border-border text-text-secondary`
   **And** "Todos" is active by default (no role/skill/disponibilidad filter) and clears `rol`, `skill` and `soloDisponibles` when tapped
   **And** "Disponibles" toggles a `disponibilidad = 'disponible'` filter and is active while on
   **And** "Por rol" opens a picker of the roles present among serranos (unique, sorted); selecting one applies the role filter and marks the chip active
   **And** "Por skill" opens a picker of the skills present among serranos (unique, sorted); selecting one applies the skill filter and marks the chip active
   **(FR24, FR25)**

6. **Given** the serrano list
   **When** it has members
   **Then** each row is a `MemberCard` (AC7) and the cards are laid out vertically with `gap-3` (12px)
   **(FR24)**

7. **Given** the `MemberCard` (Pencil `O21Fvt`)
   **When** rendered
   **Then** the whole card is a `<Link href="/plantel/{id}">` styled `rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-[14px] shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]`
   **And** the top row (`flex items-center gap-3`) contains: `Avatar` (size `md`, gradient fallback with initials, image when `avatar_url`), a name column (`flex flex-col gap-1`) with the visible name (`font-display`, 17, 500, `text-text-primary`) and an availability row (`flex items-center gap-[6px]`) made of `TierBadge` + a `size-1.5 rounded-full` dot + a label (`font-body text-xs text-text-secondary`)
   **And** a lucide `chevron-right` (20×20, `text-text-muted`) sits at the end of the row
   **And** a chips row (`flex gap-[6px] flex-wrap`) renders one `RoleChip` per **confirmed** role (the plantel reads only `profile_roles` where `confirmado = true`; self-proposed roles stay off the public directory until an admin confirms them)
   **And** availability maps `disponible → "Disponible"` (dot `bg-brand-green`), `ocupado → "Ocupado"`, `solo_eventos → "Solo eventos"` (dots `bg-text-muted` for non-disponible), and `null → "Disponible"` is omitted (no dot/label when unset)
   **(FR24)**

8. **Given** the plantel with no results for the current search/filters
   **When** rendered
   **Then** it matches Pencil `7.1 · Vacío — Plantel` (`jNOdD`): the header stays, and below it a centred block (`flex flex-col items-center gap-[18px]`) shows a 96×96 `rounded-full bg-surface-inset` circle with a lucide `search-x` icon (40×40, `text-text-muted`), then "Sin resultados" (`font-display`, 20, 700, `text-text-primary`) and "No encontramos serranos con esos filtros. Probá con otra habilidad o limpiá la búsqueda." (`font-body`, 14, `text-text-secondary`, centred), then a "Limpiar filtros" button (`h-[46px] rounded-pill bg-surface border border-border px-[22px] font-display text-[15px] font-medium text-text-primary`) that clears search **and** all filters
   **(FR24, FR25)**

9. **Given** the TabBar
   **When** rendered
   **Then** the "PLANTEL" tab is a `<Link href="/plantel">` (not a `<button>`), and `TabBarClient` marks `plantel` active when the pathname starts with `/plantel`
   **(FR24, NFR1)**

10. **Given** the member detail route
    **When** a member card is tapped
    **Then** it navigates to `/plantel/{id}` which resolves (a minimal stub route exists — the full detail screen is ZER-33 and is **not** implemented here)
    **(FR24)**

11. **Given** `tarifa_hora` privacy
    **When** the plantel queries `profiles`
    **Then** the SELECT column list never includes `tarifa_hora` (or `visibilidad_tarifa`) — the list only reads `id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, disponibilidad`, so a member's private rate is never fetched by this screen
    **(NFR1)**

12. **Given** TDD
    **When** implementation is complete
    **Then** `./node_modules/.bin/vitest run`, `tsc --noEmit` and `oxlint --quiet` are clean
    **(NFR2)**

## Tasks / Subtasks

- [x] **T1 — RED (types + pure logic)**: Write `src/features/plantel/filter.test.ts` and `src/features/plantel/transform.test.ts` covering AC4/AC5/AC7 domain logic — `filterSerranos` (search by name/skill, `soloDisponibles`, `rol`, `skill`), `availableRoles`, `availableSkills`, `displayName`-derived `name`, availability label mapping. Fail first (module absent).
- [x] **T2 — RED (schema types)**: Add `roles`, `profile_roles`, `skills`, `profile_skills` table types to `src/lib/supabase/database.types.ts` so the queries typecheck. No test — type-level, verified by `tsc`.
- [x] **T3 — GREEN (migration + RLS)**: Write `supabase/migrations/20260815120000_skills_profile_skills.sql` (tables, indexes, RLS, grants) per AC2.
- [x] **T4 — RED (components)**: Write `src/features/plantel/MemberCard.test.tsx` and `src/features/plantel/PlantelList.test.tsx` covering AC3/AC4/AC5/AC6/AC7/AC8 (header count, search + clear, chips + pickers, card link + structure, empty state + "Limpiar filtros"). Fail first.
- [x] **T5 — RED (TabBar)**: Update `src/components/TabBar.test.tsx` to expect the plantel tab as a link to `/plantel`; add a `TabBarClient` active-state case for `/plantel`. Fail first.
- [x] **T6 — GREEN (implementation)**: Build `src/features/plantel/types.ts`, `transform.ts`, `filter.ts`, `MemberCard.tsx`, `PlantelList.tsx`, `src/app/(app)/plantel/page.tsx` (server fetch + auth gate), `src/app/(app)/plantel/[id]/page.tsx` (stub), update `src/components/TabBar.tsx` + `TabBarClient.tsx`. All tests green.
- [x] **T7 — VERIFY**: Run `vitest run`, `tsc --noEmit`, `oxlint --quiet`; confirm at ~390px in-browser that `/plantel` matches frames `2.2` and `7.1`.

## Dev Notes

### Pencil specs — frame `2.2 · Plantel` (`Gy33r`, 390×844) and `7.1 · Vacío — Plantel` (`jNOdD`)

Padding pairs in Pencil are **`[horizontal, vertical]`**; 4-value arrays are `[top, right, bottom, left]`.

#### Header (both frames)

| Pencil                                                               | Tailwind                                            |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| "Plantel" — `$font-display`, 24, 700, `$text-primary`                | `font-display text-2xl font-bold text-text-primary` |
| "{n} serranos en la comunidad" — `$font-body`, 13, `$text-secondary` | `font-body text-[13px] text-text-secondary`         |

#### Search (`YiwoJ` / `fWMWZ`)

| Pencil                                                                                                  | Tailwind / React                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `fill: $surface`, `stroke: $border` 1px, `cornerRadius: 16`, `height: 48`, `padding: [16,0]`, `gap: 10` | `h-12 rounded-2xl bg-surface border border-border px-4 flex items-center gap-[10px]` |
| lucide `search` 18×18 `$text-muted`                                                                     | `<Search size={18} className="text-text-muted" />`                                   |
| placeholder "Buscar por nombre o skill" `$font-body` 15 `$text-muted`                                   | `placeholder:text-text-muted text-[15px]` (input)                                    |
| clear `x` 18×18 `$text-muted` (empty-state variant only, when text present)                             | `<button aria-label="Limpiar búsqueda"><X size={18} /></button>`                     |

#### Filter chips (`AGLSQ` — `f1`…`f4`)

| Pencil                                           | Tailwind                                              |
| ------------------------------------------------ | ----------------------------------------------------- |
| `cornerRadius: 999`, `padding: [14, 8]`          | `rounded-pill px-[14px] py-2`                         |
| text `$font-display`, 13, 500                    | `font-display text-[13px] font-medium`                |
| active `f1` `fill: $primary`, no stroke          | `bg-primary text-on-primary`                          |
| inactive `f2`…`f4` `fill: $surface`, `$border`   | `bg-surface border border-border text-text-secondary` |
| order: Todos · Disponibles · Por rol · Por skill | —                                                     |

#### Empty state (`gKTbt` — `empty`)

| Pencil                                                                                                                                  | Tailwind / React                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ec13` circle `fill: $surface-inset`, `r: 999`, 96×96                                                                                   | `size-24 rounded-full bg-surface-inset flex items-center justify-center`                                                 |
| lucide `search-x` 40×40 `$text-muted`                                                                                                   | `<SearchX size={40} className="text-text-muted" />`                                                                      |
| "Sin resultados" `$font-display` 20 700 `$text-primary`                                                                                 | `font-display text-[20px] font-bold text-text-primary`                                                                   |
| "No encontramos serranos con esos filtros. Probá con otra habilidad o limpiá la búsqueda." `$font-body` 14 `$text-secondary`            | `font-body text-sm text-text-secondary text-center`                                                                      |
| `cl13` "Limpiar filtros" `fill: $surface`, `$border`, `r: 999`, `height: 46`, `padding: [22,0]`, `$font-display` 15 500 `$text-primary` | `h-[46px] rounded-pill bg-surface border border-border px-[22px] font-display text-[15px] font-medium text-text-primary` |

#### MemberCard (`O21Fvt`, reusable)

| Pencil                                                                                                                          | Tailwind / React                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| container `fill: $surface`, `$border` 1px inside, `r: 24`, shadow `[0,10,30,-12] #1a161426`, vertical `gap: 14`, `padding: 16`  | `rounded-[24px] bg-surface border border-border p-4 flex flex-col gap-[14px] shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]`         |
| row `gap: 12` — `mav` Avatar → `aaHkg`; `namecol` (vertical `gap: 4`); `chevron-right` 20 `$text-muted`                         | `flex items-center gap-3` + `Avatar` (md) + `flex flex-col gap-1` + `<ChevronRight size={20} className="text-text-muted ml-auto" />` |
| name `$font-display` 17 500 `$text-primary`                                                                                     | `font-display text-[17px] font-medium text-text-primary`                                                                             |
| `avail` row `gap: 6` — `tb` TierBadge → `wv7cW`, `ellipse` `$brand-green` (dot), "Disponible" `$font-body` 12 `$text-secondary` | `flex items-center gap-[6px]` + `TierBadge` + `size-1.5 rounded-full bg-brand-green` + `font-body text-xs text-text-secondary`       |
| `chips` row `gap: 6` — `rc1`/`rc2` RoleChip → `Xk6Li`                                                                           | `flex gap-[6px] flex-wrap` + `RoleChip` (confirmed, no pending dot)                                                                  |

### Architecture / patterns to follow

- **Server component fetch + client filter.** `page.tsx` is an async server component that (1) gates auth via `redirect("/auth/login")` (pattern: `src/app/(app)/profile/page.tsx`), (2) fetches serranos + their roles + skills, (3) transforms rows into `SerranoMember[]`, and (4) renders `<PlantelList members={…} />`. Filtering is client-side (community is small, ~24 serranos — no pagination needed; note this in the code if it grows).
- **Reuse** `src/features/profile/displayName.ts` for the visible name, `src/components/Avatar`, `TierBadge`, `RoleChip` for the card. Do **not** recreate them.
- **Pure, unit-tested logic** lives in `src/features/plantel/filter.ts` (`filterSerranos`, `availableRoles`, `availableSkills`) and `transform.ts` (`buildSerranoMembers`, `availabilityLabel`). The Supabase read stays in `page.tsx` so it is not mocked in unit tests.
- **Queries:** `profiles.select("id, nombre, apellido, apodo, nombre_visible, avatar_url, tier, disponibilidad").neq("tier", "tourist")`; `profile_roles.select("profile_id, roles(nombre)").eq("confirmado", true)`; `profile_skills.select("profile_id, skills(nombre)")`. Join in JS (`transform.ts`). Never select `tarifa_hora` / `visibilidad_tarifa` (AC11).
- **TabBar:** add a `tabHrefs` map (`inicio → /`, `plantel → /plantel`, `nodo → /nodo/tasks`, `perfil → /profile`; `agenda` has no route yet and stays a `<button>`). Tabs with a `href` render as `next/link` `Link`; the rest keep the `onTabChange` button behaviour. This also closes a known deferred-work item ("Sin JavaScript no se puede navegar") for every built screen. `TabBarClient` adds `pathname.startsWith("/plantel") → "plantel"`.
- **Server guard / error handling:** `.single()` reads in `page.tsx` are for the auth check only (not used for plantel data); the plantel list itself uses `.select()` (many rows) and treats `data` as possibly null (empty list → AC8 empty state).

### Files to touch

| File                                                           | Action                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `supabase/migrations/20260815120000_skills_profile_skills.sql` | NEW — tables, indexes, RLS, grants (AC2)                                      |
| `src/lib/supabase/database.types.ts`                           | UPDATE — add `roles`, `profile_roles`, `skills`, `profile_skills` table types |
| `src/features/plantel/types.ts`                                | NEW                                                                           |
| `src/features/plantel/transform.ts`                            | NEW — `buildSerranoMembers`, `availabilityLabel`                              |
| `src/features/plantel/filter.ts`                               | NEW — `filterSerranos`, `availableRoles`, `availableSkills`                   |
| `src/features/plantel/MemberCard.tsx`                          | NEW — AC7                                                                     |
| `src/features/plantel/PlantelList.tsx`                         | NEW — `"use client"` AC3/4/5/6/8                                              |
| `src/features/plantel/filter.test.ts`                          | NEW                                                                           |
| `src/features/plantel/transform.test.ts`                       | NEW                                                                           |
| `src/features/plantel/MemberCard.test.tsx`                     | NEW                                                                           |
| `src/features/plantel/PlantelList.test.tsx`                    | NEW                                                                           |
| `src/app/(app)/plantel/page.tsx`                               | NEW — async server component (fetch + gate + render)                          |
| `src/app/(app)/plantel/[id]/page.tsx`                          | NEW — minimal stub (ZER-33 owns the detail)                                   |
| `src/components/TabBar.tsx`                                    | UPDATE — plantel (and other built routes) as `Link`                           |
| `src/components/TabBarClient.tsx`                              | UPDATE — active state for `/plantel`                                          |
| `src/components/TabBar.test.tsx`                               | UPDATE — plantel tab is a link                                                |

Do **not** modify `(app)/layout.tsx`, `StatusBar`, `EmptyState`, `Avatar`, `TierBadge`, `RoleChip`, or any `tasks`/`membership`/`profile` file. Do **not** build the member detail screen (`/plantel/[id]` content is ZER-33) or skill editing (`/plantel` is read-only; editing skills is ZER-34).

### Testing

Vitest + Testing Library. Mirror `src/features/tasks/actions.test.ts` (mock patterns) and the class-level Pencil assertions from `src/components/EmptyState.test.tsx` / `src/app/(app)/nodo/tasks/new/NewTaskForm.test.tsx`.

| Test                   | What it verifies                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filter.test.ts`       | search by name/apodo/apellido/skill (case-insensitive), `soloDisponibles`, `rol`, `skill`, combined filters, empty `q` returns all                                                                            |
| `transform.test.ts`    | rows → `SerranoMember` (roles/skills joined, `name` via `nombre_visible`, availability label mapping)                                                                                                         |
| `MemberCard.test.tsx`  | link href `/plantel/{id}`, Avatar/TierBadge/RoleChip present, availability dot+label, chevron, Pencil classes                                                                                                 |
| `PlantelList.test.tsx` | header "{n} serranos en la comunidad", search filters list, clear button, chips (Todos default active, Disponibles toggle, Por rol/Por skill pickers), empty state copy + "Limpiar filtros" resets everything |
| `TabBar.test.tsx`      | plantel tab renders a link to `/plantel`; other linked tabs; agenda stays a button; `TabBarClient` active on `/plantel`                                                                                       |

### Known deviations / decisions (do NOT fix in this story)

1. **"Por rol" / "Por skill" picker chrome is not drawn in Pencil.** The chips exist (`f3`/`f4`) but no dropdown/sheet frame is designed. Implemented as a minimal popover panel using DS tokens (`bg-surface border border-border rounded-2xl shadow`), single-select, toggled by the chip. This is a design decision, not a Pencil copy; log it for the designer if the fidelity contract for M4 is later formalized.
2. **Availability dot colors beyond "Disponible".** Pencil only models the `disponible` state on `MemberCard` (green dot). `ocupado` / `solo_eventos` use a neutral `bg-text-muted` dot. Low risk; revisit if Pencil adds states.
3. **Layout padding.** As already logged in `deferred-work.md`, `(app)/layout.tsx` applies a uniform `p-5`; the plantel wrapper's Pencil padding `[8, 20, 20, 20]` (top 8) is not reproduced per-screen. Do not touch `layout.tsx`.
4. **Member detail is a stub.** `/plantel/[id]` returns a minimal placeholder; the full screen is ZER-33. This is an explicit scope cut, not tech debt to be silently shipped as final.

### References

- [Source: `docs/roadmap/M4 · Plantel y directorio.md` — scope + DoD]
- [Source: `docs/roadmap/Modelo de datos.md` — `skills` + `profile_skills`]
- [Source: `docs/roadmap/Seguridad RLS.md` — tourists out of plantel, tarifa privacy]
- [Source: `docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md` §6 — schema + RLS]
- [Source: Pencil `design/nodo-serrano.pen`, frames `Gy33r` (2.2), `jNOdD` (7.1), `O21Fvt` (MemberCard)]
- [Source: `src/app/(app)/profile/page.tsx` — server auth/tier guard pattern]
- [Source: `src/app/(app)/nodo/tasks/page.tsx` — server-fetch page pattern]
- [Source: `src/features/profile/displayName.ts` — visible name]
- [Source: `supabase/migrations/20260728190000_membership_roles.sql` — RLS + grants pattern for catalog/N:N tables]
- [Source: Linear ZER-32]

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (opencode)

### Debug Log References

### Completion Notes List

- Built the M4.1 plantel screen end-to-end: schema (skills + profile_skills + RLS), read-only `/plantel` server page, client `PlantelList`/`MemberCard`, and TabBar links.
- `filterSerranos`/`availableRoles`/`availableSkills` are pure and unit-tested (search by name/skill, disponibilidad, rol, skill). `buildSerranoMembers` joins profiles + profile_roles + profile_skills and drops tourists.
- Added a `profile_roles` SELECT policy (`"Anyone can read serrano profile roles"`) beyond the original AC — the role chips and the "Por rol" filter require reading other serranos' roles, which M3's "own roles / admins" policies do not expose. AC2 was amended accordingly.
- The `profiles` read policy (`"Anyone can read serrano profiles"`, `tier <> 'tourist'`) keeps tourists out of the plantel while preserving the existing own-profile and admin policies (OR'd).
- `tarifa_hora` / `visibilidad_tarifa` are never selected by the plantel query (AC11); the roadmap's column-hiding "riesgo abierto" for `tarifa_hora` remains deferred.
- TabBar: converted `inicio/plantel/nodo/perfil` tabs to `Link`s (closing the "no-JS navigation" deferred-work item for built screens); `agenda` stays a `<button>` (no route yet). `TabBarClient` marks `plantel` active on `/plantel`.
- `/plantel/[id]` is a minimal stub route so MemberCard links resolve; the detail screen is ZER-33.

### File List

- `supabase/migrations/20260815120000_skills_profile_skills.sql` (NEW)
- `src/lib/supabase/database.types.ts` (MODIFIED)
- `src/features/plantel/types.ts` (NEW)
- `src/features/plantel/transform.ts` (NEW)
- `src/features/plantel/filter.ts` (NEW)
- `src/features/plantel/MemberCard.tsx` (NEW)
- `src/features/plantel/PlantelList.tsx` (NEW)
- `src/features/plantel/filter.test.ts` (NEW)
- `src/features/plantel/transform.test.ts` (NEW)
- `src/features/plantel/MemberCard.test.tsx` (NEW)
- `src/features/plantel/PlantelList.test.tsx` (NEW)
- `src/app/(app)/plantel/page.tsx` (NEW)
- `src/app/(app)/plantel/[id]/page.tsx` (NEW)
- `src/app/(app)/plantel/page.test.tsx` (NEW)
- `src/components/TabBar.tsx` (MODIFIED)
- `src/components/TabBarClient.tsx` (MODIFIED)
- `src/components/TabBar.test.tsx` (MODIFIED)
- `src/components/TabBarClient.test.tsx` (NEW)
- `_bmad-output/implementation-artifacts/4-1-plantel-list-and-filters.md` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED)

## Change Log

- 2026-08-15 — Story created (status ready-for-dev).
- 2026-08-15 — Implemented via TDD (red-green per task); all 12 ACs covered; 683 tests, `tsc --noEmit`, `oxlint --quiet` clean; status → review.
- 2026-08-15 — Code review (adversarial, 3 layers). Findings fixed: (1) plantel now reads only `confirmado = true` roles — self-proposed roles stay off the public directory; AC7 amended. (2) `filterSerranos` normalizes `rol`/`skill` once instead of non-null assertions. Dismissed/deferred: duplicated `nombre_visible` logic in `transform.ts` (deliberate — avoids coupling to `src/features/profile/displayName.ts`, which the story scopes out); query error → empty list (same class as pre-existing `.single()` findings in `deferred-work.md`).
