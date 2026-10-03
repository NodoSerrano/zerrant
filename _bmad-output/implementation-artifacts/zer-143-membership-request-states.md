# Story ZER-143: Membership request & interview state machine

Status: review (design approved 2026-10-02; contract for ZER-144, ZER-167, ZER-169)

## Story

As a platform admin,
I want membership requests to move through explicit interview states (including "reprogramación"),
so that a busy schedule is never recorded or shown as a rejection of the person, and every change is auditable.

## Acceptance Criteria

1. Given a request, when an admin marks the slot as unavailable, then `estado = 'reprogramacion'` (not closed/rejected) and the applicant sees "Reprogramación requerida".
2. Invalid transitions (e.g. `aprobado → entrevista_solicitada`) fail in the server (DB), not only in UI.
3. Every state change writes a history row with actor, timestamp, previous and new state. The applicant cannot write admin states.

## Design (contract)

### Enum `public.membership_request_estado` (replaced; DB values without accents)

| DB value                 | UI label                  | Terminal |
| ------------------------ | ------------------------- | -------- |
| `pendiente_coordinacion` | Pendiente de coordinación | no       |
| `entrevista_solicitada`  | Entrevista solicitada     | no       |
| `entrevista_coordinada`  | Entrevista coordinada     | no       |
| `reprogramacion`         | Reprogramación requerida  | no       |
| `entrevista_realizada`   | Entrevista realizada      | no       |
| `aprobado`               | Aprobado como miembro     | yes      |
| `cerrada`                | Solicitud cerrada         | yes      |

Insert lands in `pendiente_coordinacion` ("solicitud iniciada" = the insert event itself, history row `null → pendiente_coordinacion`).

### Valid transitions (anything else raises in DB)

| from \ to                | actor allowed | targets                                                     |
| ------------------------ | ------------- | ----------------------------------------------------------- |
| `pendiente_coordinacion` | admin         | `entrevista_solicitada`, `cerrada`                          |
| `entrevista_solicitada`  | admin         | `entrevista_coordinada`, `reprogramacion`, `cerrada`        |
| `entrevista_coordinada`  | admin         | `reprogramacion`, `entrevista_realizada`, `cerrada`         |
| `reprogramacion`         | admin         | `entrevista_solicitada`, `entrevista_coordinada`, `cerrada` |
| `entrevista_realizada`   | admin         | `aprobado`, `cerrada`                                       |
| `aprobado`, `cerrada`    | —             | none (terminal)                                             |

Seeded in table `public.membership_request_transitions(from_estado, to_estado, actor)` with `actor in ('admin','owner')`. In this story every edge is `admin`; ZER-144 may add `owner` edges (e.g. owner `reprogramacion → entrevista_solicitada` when picking a new slot) by inserting rows — no enum or function change.

### History `public.membership_request_events` (append-only)

`id uuid pk`, `request_id uuid not null fk → membership_requests on delete cascade (requests themselves are not deletable by any app role; deleting an account removes its data), `from_estado estado null`(null = creation),`to_estado estado not null`, `actor_id uuid null fk → profiles on delete set null`, `motivo text null`(ZER-169 makes it required for`cerrada`), `created_at timestamptz default now()`. Index `(request_id, created_at)`.

### Enforcement

- `BEFORE UPDATE OF estado` trigger on `membership_requests`: rejects any (old, new) pair not in `membership_request_transitions` → raises `P0001`. Covers every path (RPC, service role, future code).
- `AFTER INSERT` / `AFTER UPDATE OF estado` trigger (security definer): writes the history row with `auth.uid()` as actor and the motivo passed via the RPC (`set_config('app.transition_motivo', …, true)`).
- Single RPC `transition_membership_request(p_request_id uuid, p_to estado, p_motivo text default null) returns jsonb`, security definer, `search_path=''`: resolves the edge's actor and authorizes (admin = `is_platform_admin`, owner = `profile_id = auth.uid()`), does the update guarded by `estado = <read from>` (TOCTOU), and on `aprobado` also sets `profiles.tier = tier_solicitado` (keeps the `standard` cap). EXECUTE only for `authenticated`.
- `approve_membership_request` and `reject_membership_request` are dropped; `src/features/admin/actions.ts` calls the new RPC.
- One-active-request index replaced: unique on `profile_id where estado not in ('aprobado','cerrada')`.

### RLS / grants

- `membership_requests`: unchanged read (owner own row, admin all). No UPDATE grant exists for `authenticated`; keep it that way. Drop the now-redundant admin UPDATE policy so the RPC is the only write path. `estado` stays out of the INSERT column grant.
- `membership_request_events`: RLS on; SELECT admin only (ZER-169 AC2: applicant sees its result, not internal history); no INSERT/UPDATE/DELETE grant to anyone — trigger writes only.
- `membership_request_transitions`: SELECT for `authenticated`; no writes.

### Data migration (explicit, reversible)

`pendiente → pendiente_coordinacion`, `aprobada → aprobado`, `rechazada → cerrada` (injective). Backfill reconstructs history per existing request: `null → pendiente_coordinacion` (actor = applicant, at `created_at`), plus `pendiente_coordinacion → current` (actor = `revisado_por`, at `actualizado_en`) when the current state is not the initial one. Reverse script in the migration header: intermediate states → `pendiente`, `aprobado → aprobada`, `cerrada → rechazada`, drop new objects.

## Approved decisions (2026-10-02)

1. No `iniciada` value in the enum; the creation history row (`null → pendiente_coordinacion`) records that moment.
2. Strict machine: `aprobado` only from `entrevista_realizada`, no shortcut. The current "Aprobar" button only appears when the request is in `entrevista_realizada`.
3. RequestCard transition buttons: first design a minimal frame in `design/nodo-serrano.pen` (existing design system, padding pairs `[horizontal, vertical]`), screenshot approved by the user before implementation. Full admin pipeline stays in ZER-167.

## Tasks / Subtasks

- [x] T1 Pure module `src/features/membership/request-state.ts` + tests first (AC2): estados, labels, `canTransition(from,to,actor)`, `nextStates`, terminal set. (orchestrator)
- [x] T2 DB test harness: `vitest.db.config.ts` (node env) + `supabase/tests/membership-request-states.db.test.ts` against local Supabase; RED before migration (AC1-3). Parity test: DB transitions table == TS table. (orchestrator)
- [x] T3 Migration `supabase/migrations/2026100XXXXXXX_zer143_membership_request_states.sql` (orchestrator only).
- [x] T4 Regenerate `src/lib/supabase/database.types.ts` (impl).
- [x] T5 Call-sites (impl): `src/features/admin/actions.ts` (+ tests) → new RPC; `membership/actions.ts` pending check → active-state check; `profile/page.tsx`, `solicitar/enviado/page.tsx`, `admin/roles/page.tsx`, `admin/membresias/page.tsx` filters; applicant-facing state label with accents; feedback message on each transition.
- [x] T5b Pencil frame for RequestCard transition actions → user approval → impl codes it (no "Rechazar" copy; "Reprogramar" for slot issues).
- [x] T6 Gates + Codex adversarial review focused on RLS and bypasses.

## Dev Notes

- No real-DB test infra exists today (schema tests read SQL text, e.g. `src/lib/db/projects-schema.test.ts`). DB tests live outside `src/` so the `--dir src` gate stays DB-free; run with `./node_modules/.bin/vitest run -c vitest.db.config.ts`.
- `set search_path = ''` requires schema-qualified types in DECLARE (see `20260807140000_approve_membership_rpc.sql`).
- Never edit committed migrations; RLS recursion lesson from ZER-65: no policy subquery on its own table.
- Out of scope: full admin pipeline UI (ZER-167), interview notes (ticket 11), booking/slots (ticket 08), mandatory motivo (ZER-169).

### References

- supabase/migrations/20260728190000_membership_roles.sql, 20260807140000_approve_membership_rpc.sql, 20260807150000_admin_membership_security.sql, 20260813210000_membership_requests_one_pending.sql, 20260919021000_zer65_membership_requests_rls_recursion.sql, 20260922020000_zer108_membership_screening.sql
- docs/roadmap/M3 · Membresía y roles.md, Seguridad RLS.md, Modelo de datos.md
- Linear ZER-143, ZER-144, ZER-167, ZER-169

## Dev Agent Record

### Agent Model Used

- Orchestrator (design, pure + DB tests, migration, RLS, post-review fixes): Claude Opus 5.5
- Implementer (phase A call-sites, phase B UI and server action): Claude Sonnet 5.5
- Adversarial reviewer: Codex GPT-6 Luna

### Debug Log References

- Local `node_modules` predated `main`'s lockfile (missing `@serwist/next`): reinstalled with `pnpm install --frozen-lockfile`; stale `.next` cache removed.
- Pencil renderer stopped drawing nodes inserted incrementally into existing frames; the frames were rebuilt as single-tree root inserts (6.1b `B3bxu7`, 2.7b `j7Pk2s`).
- Regenerated `database.types.ts` emits `Returns: Json` for jsonb RPCs; the hand-narrowed shapes for `sync_profile_skills` and `transition_membership_request` were restored.

### Completion Notes List

- Pure state machine first (TDD), then DB tests against local Supabase (RED → GREEN), then the migration.
- Pre-existing hole closed: blanket `grants_dml_public` let applicants insert `estado`/`tier_solicitado`; table DML on `membership_requests` narrowed back to the screening insert columns.
- Legacy data migration verified on real legacy rows (pendiente/aprobada/rechazada), including reconstructed history.
- Codex review triage: (1) RPC actor check confirmed per-edge — service_role trust boundary documented in the migration; (2) story backfill wording corrected; (3) explicit reverse grants/policies in the migration header; (4) GUC motivo spoofing discarded (transaction-local, overwritten and cleared by the RPC).
- Post visual-QA fixes (375px): stable admin ordering (`created_at desc, id asc`), close confirmation replaces the whole actions zone, 44px touch target on "Cerrar solicitud", non-wrapping estado chip and relative date.
- Gates: `vitest run --dir src` 1553/1553, `tsc --noEmit` clean, `oxlint --quiet` clean, `oxfmt --check` clean; DB tests 18/18.

### File List

- supabase/migrations/20261002210000_zer143_membership_request_states.sql (new)
- supabase/tests/membership-request-states.db.test.ts (new)
- vitest.db.config.ts (new)
- src/features/membership/request-state.ts (new) + request-state.test.ts (new)
- src/features/membership/admin-request-actions.ts (new) + admin-request-actions.test.ts (new)
- src/components/MembershipEstadoChip.tsx (new) + **tests**/MembershipEstadoChip.test.tsx (new)
- src/lib/supabase/database.types.ts
- src/features/membership/actions.ts + actions.test.ts
- src/features/admin/actions.ts + **tests**/actions.test.ts
- src/components/RequestCard.tsx + **tests**/RequestCard.test.tsx
- src/app/(app)/admin/membresias/page.tsx + **tests**/membresias-page.test.tsx
- src/app/(app)/admin/roles/page.tsx + **tests**/roles-page.test.tsx
- src/app/(app)/profile/page.tsx, PendingMembershipCard.tsx + PendingMembershipCard.test.tsx
- src/app/(modal)/solicitar/enviado/page.tsx + page.test.tsx
- src/features/profile/**tests**/profile-tourist.test.tsx
- design/nodo-serrano.pen (frames 6.1b and 2.7b)
