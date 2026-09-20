---
id: SPEC-m6-aportes-eventos
companions:
  - screen-inventory.md
  - data-model.md
  - ../../design/nodo-serrano.pen
  - ../../docs/roadmap/M6 · Aportes y eventos.md
  - ../../docs/roadmap/Seguridad RLS.md
  - ../../docs/roadmap/Glosario.md
  - ../../docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# M6 · Aportes y eventos

## Why

**Pain:** Two of the node's core rhythms have no home in the product. **Aportes** — the contributions that back a person's tier (económicos) and rol (comunitarios) — exist only as a greyed "Mis aportes" menu row and a hardcoded "Todavía no hay aportes." line in member detail. **Eventos** are worse: `/agenda` is a literal stub page that exists solely so the TabBar navigates without JavaScript, and the `agenda` tab in `src/components/TabBar.tsx` points at it.

**Mandate now:** M6 delivers both sub-domains against real tables. An aporte is **registered, never charged** — the app is a ledger of contributions, not a payment processor. An evento is created by any serrano, shows on a day-strip agenda, and collects RSVPs. Goal is **production**: the `/agenda` stub is deleted, not decorated.

## Capabilities

### Aportes

- **CAP-1**
  - **intent:** `aportes` exists in Postgres with the PRD's nine-value `tipo` enum, RLS enabled, and authenticated table privileges verified.
  - **success:** A migration creates `aportes` with `tipo` = exactly `economico, donacion, prestamo, charla, actividad, mantenimiento, administracion, yerba, otro` (nine values, no more), plus `profile_id`, `descripcion`, `monto` (nullable), `fecha`, `registrado_por`, `created_at`; RLS is enabled with explicit policies in the same migration; `pnpm db:check-grants` passes (CI job `db grants (authenticated)`).

- **CAP-2**
  - **intent:** An aporte can be registered (`4.6`) — by the contributor for themselves, or by an admin on someone else's behalf.
  - **success:** The form submits tipo, descripcion, fecha, and an optional monto; a serrano registering their own aporte writes `profile_id = registrado_por = auth.uid()`; a platform admin can register an aporte where `profile_id` is another person and `registrado_por` is the admin; `monto` may be left empty for non-económico types; a non-admin cannot write an aporte for someone else — enforced by RLS, not only by the UI.

- **CAP-3**
  - **intent:** "Mis aportes" (`3.4`) lists the signed-in person's own aportes, built as a clean story from scratch against the real `aportes` table.
  - **success:** The greyed "Mis aportes" row in `src/app/(app)/profile/SerranoMenu.tsx` becomes an enabled row with a real count and destination; the screen lists the viewer's aportes ordered by `fecha`, showing tipo, descripcion, fecha, and monto when present; the empty case renders a designed empty state; the screen matches frame `3.4 · Mis aportes`.

- **CAP-4**
  - **intent:** Aportes appear in plantel member detail, feeding the directory delivered by M4.
  - **success:** The "Aportes" section in `src/features/plantel/MemberDetail.tsx` lists that member's aportes instead of the hardcoded "Todavía no hay aportes." line; the existing placeholder assertion in `src/features/plantel/MemberDetail.test.tsx` is updated to the new behavior; monto visibility follows the same read rule as the rest of the table (read = serranos).

### Eventos

- **CAP-5**
  - **intent:** `events` and `event_attendance` exist in Postgres with the PRD shape and RSVP enum, RLS enabled and privileges verified — **and** the missing `event_attendance` rule is written into `docs/roadmap/Seguridad RLS.md`.
  - **success:** A migration creates `events` (`titulo`, `descripcion`, `lugar`, `inicio`, `fin`, `creado_por`, `created_at`) and `event_attendance` (PK `event_id + profile_id`, `estado` enum `voy/quizas/no`); RLS enabled with explicit policies; `pnpm db:check-grants` passes; `docs/roadmap/Seguridad RLS.md` gains an `event_attendance` bullet stating that each person manages their own attendance row.

- **CAP-6**
  - **intent:** The agenda (`2.5`) is a real screen with a day strip and a designed empty state (`7.4`), replacing the stub page.
  - **success:** `src/app/(app)/agenda/page.tsx` no longer renders the "llega en un milestone posterior" placeholder copy; the agenda renders a day strip and the events for the selected day from the `events` table; with no events the screen matches frame `7.4 · Vacío Agenda`; the `agenda` tab in `src/components/TabBar.tsx` keeps working and keeps its active-state treatment.

- **CAP-7**
  - **intent:** Any serrano can create an event (`5.2`).
  - **success:** The create form submits titulo, descripcion, lugar, inicio, and fin; on success an `events` row is written with `creado_por` = the author; tourists are blocked by RLS, not only by the UI; the new event appears on its day in the agenda immediately; `fin` is validated as not before `inicio`.

- **CAP-8**
  - **intent:** Event detail (`5.1`) shows the event and who is coming.
  - **success:** Detail renders titulo, descripcion, lugar, inicio and fin, and the attendee list grouped by RSVP `estado`; the viewer's own current RSVP is visible; the creator is identifiable; the list reads real `event_attendance` rows, never a count faked from the client.

- **CAP-9**
  - **intent:** RSVP works — `voy` / `quizas` / `no` — and each person owns only their own answer.
  - **success:** A serrano can set and change their RSVP from event detail; the write is an upsert on the `(event_id, profile_id)` primary key so changing an answer updates one row rather than creating a second; the attendee list reflects the change; a client attempting to write or modify someone else's attendance row is rejected by RLS.

- **CAP-10**
  - **intent:** An event can be edited or deleted (`5.3`) by its creator or by a platform admin.
  - **success:** The edit screen prefills the event's current values and saves them; delete removes the event and its attendance rows; a serrano who is neither creator nor platform admin can do neither, enforced by policy; a deleted event disappears from the agenda and its detail route no longer resolves.

## Constraints

- **SSOT UI:** `design/nodo-serrano.pen` is the only visual source of truth. Node ids for M6 frames are **not yet resolved** — each must be fetched through the `mcp__pencil` tools before its UI story is implemented (see `screen-inventory.md`). Never open the `.pen` file with `Read`/`rg`; it is encrypted.
- **Aportes are recorded, never charged.** No payment UI, no checkout, no wallet, no "pagar" affordance anywhere in this milestone. `monto` is a number in a ledger.
- **DB-first authorization:** Every rule in this SPEC is enforced by RLS policies in a migration. Server actions may add ergonomics, never the only guard.
- **Grants before policies:** New tables inherit DML from the ZER-49 default privileges, but RLS and policies must still be enabled explicitly per table. `pnpm db:check-grants` must pass. See the "Grants vs RLS" section in `data-model.md`.
- **Enum fidelity:** `tipo` has **exactly nine** values in the PRD order; `event_attendance.estado` has exactly `voy`, `quizas`, `no` (no accent on `quizas` in the enum, whatever the UI label says). Domain enums stay in Spanish; code identifiers stay in English; user-facing copy stays in Spanish as in Pencil.
- **The `/agenda` stub is replaced, not extended.** The placeholder copy shipped by ZER-50 must be gone; the route and the TabBar entry survive.
- **Production-ready bar:** No stubbed backends, no fake attendee counts, no "fix later" inside in-scope work.
- **Engineering rules:** TDD (Vitest + Testing Library) — failing test first, then implementation. `pnpm test` green before any story is claimed done.
- **Reuse the DS:** Compose from the primitives delivered by `SPEC-ui-fidelity-m0-m2`. An AporteItem or EventCard, if a frame needs one, is built as a shared component, not page-local CSS.
- **Behavior preserve:** Auth, onboarding, profile, plantel, tasks, and (if already shipped) projects must not regress.
- **Build order:** aportes schema + RLS → register → Mis aportes → member detail; then events schema + RLS → agenda + empty → create → detail → RSVP → edit/delete.

## Non-goals

These are **parked decisions**, recorded in `docs/roadmap/Backlog.md`, whose header reads _"No borrar: son decisiones tomadas de posponer"_. Do not implement, scaffold, or leave hooks for them.

- **Puntos Serrano** — gamification and the valuation of aportes. Parked. The `puntos` column on `aportes` **stays commented out** in the data model; do not add it to the migration, the types, or the UI.
- **On-chain payments** — _"los aportes económicos se registran, no se cobran en la app"_. Parked. This is the hard line of this milestone.
- **Push notifications** — event reminders, birthday reminders, RSVP nudges. Parked.
- **Chat / mensajería interna.** Parked.
- Anything in **M5** (projects, project membership, join requests) or **M7** (cumpleaños, PWA, pulido). Birthdays are computed from `fecha_nacimiento` in M7, not here.
- Recurring events, calendar export / ICS, external calendar sync, event capacity limits, or waitlists — none appear in the PRD or the milestone scope.
- A month-grid calendar view. The milestone scope says _"tira de días"_ (day strip); a full calendar grid is not in scope.

## Success signal

The milestone DoD from `docs/roadmap/M6 · Aportes y eventos.md`, verbatim:

> - Se registra un aporte y aparece en el perfil.
> - Se crea un evento, la gente confirma y se ve la lista de asistentes.

Demonstrated end-to-end on staging with real accounts, against the real tables under RLS. In addition: `/agenda` no longer serves the stub copy, and the "Mis aportes" row and member-detail "Aportes" section show real data — no dead chrome from M0–M2 remains in the aportes surface.

## Assumptions

- **Node ids are unresolved.** The Pencil app was not running when this SPEC was written, so `screen-inventory.md` carries `TBD` for every node id. Resolving them via `mcp__pencil` is a prerequisite of each UI story.
- **`3.4 · Mis aportes` is a clean story from scratch.** It was attempted before in **PR #27 (ZER-35)**, which was **closed without merging** and deferred to this milestone. The decision recorded here: build it fresh against the real `aportes` table. The closed PR is **at most a UI reference**; it is not reopened, not rebased, and not cherry-picked, and nothing in it is treated as an existing contract.
- **`event_attendance` has no rule in `docs/roadmap/Seguridad RLS.md`.** It exists only in the PRD, as _"cada uno gestiona su propia asistencia"_. The decision taken: CAP-5 (story 6.5) **adds that rule to `docs/roadmap/Seguridad RLS.md`** as part of the migration story, so the RLS reference stays the complete picture.
- **Admin-load of aportes** means `profiles.is_platform_admin` (per `docs/roadmap/Seguridad RLS.md`: _"inserta dueño o admin (económicos → Tesorería)"_). Tesorería is a **rol**, not a separate permission axis in the data model, so "económicos → Tesorería" is read as an organizational convention, not an enforceable policy clause in M6.
- **Event edit/delete admin** means `profiles.is_platform_admin` (_"edita/borra creador o admin"_), unlike M5 where "admin" is scoped to a project.
- **Read scope for aportes** is serranos (non-tourist), per `docs/roadmap/Seguridad RLS.md`. Read scope for events is any authenticated user, including tourists.
- **`fecha` on an aporte is a `date`** supplied by the person, and may differ from `created_at`. The list sorts by `fecha`.
- **Deleting an event cascades** its `event_attendance` rows; there is no soft-delete or `estado` column on `events` in the PRD.
