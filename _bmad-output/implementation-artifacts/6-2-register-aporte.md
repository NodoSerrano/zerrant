# Story 6.2: Register aporte (`4.6 · Registrar aporte`)

Status: backlog

## Linear

- **ZER-88** — Story 6.2: Registrar aporte (4.6)
- URL: https://linear.app/zerrant/issue/ZER-88
- Branch: `juantandil123/zer-88-story-62-registrar-aporte-46`
- Priority: Medium (P3) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- Unblocks M6 DoD bullet _"Se registra un aporte y aparece en el perfil."_ — the "se registra" half.
- Depends on story 6.1 (ZER-87). Stories 6.3 and 6.4 display what this one writes.

## Story

As a serrano,
I want to register a contribution I made,
so that my aportes are on record and back my tier and rol.

## Acceptance Criteria

1. **Given** `design/nodo-serrano.pen` is encrypted and the node id for `4.6 · Registrar aporte` reads `TBD`
   **When** this story starts
   **Then** the node id is resolved through the `mcp__pencil` tools and recorded back into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, **before** any implementation (UX-DR27, NFR16)
   **And** the `.pen` file is never opened with `Read`, `bat`, `rg`, `fd`, or any other filesystem tool (NFR16)

2. **Given** the register-aporte route as a serrano
   **When** the form renders
   **Then** it collects tipo (a selector over the nine values), descripcion, fecha, and an **optional** monto, matching frame `4.6` at ~390px in IA, labels and primary-CTA placement (FR40, UX-DR20, UX-DR28)
   **And** the stored `tipo` is the unaccented enum value (`economico`, `donacion`, `prestamo`, …) whatever the accented Spanish label reads (NFR15)

3. **Given** I submit the form for myself
   **When** the action runs
   **Then** an `aportes` row is written with `profile_id = registrado_por = my profile id` (FR40)

4. **Given** I leave monto empty
   **When** the row is written
   **Then** `monto` stores `null`, not `0` and not an empty string coerced to a number (FR40, FR39)

5. **Given** the whole register-aporte surface
   **When** it is reviewed
   **Then** it contains no payment, checkout, wallet, "pagar", or price affordance of any kind — the aporte is **recorded, never charged** (FR40, NFR12)

6. **Given** I am a platform admin
   **When** I register an aporte on behalf of another serrano
   **Then** the row is written with `profile_id` = that person and `registrado_por` = me (FR40)

7. **Given** a serrano who is **not** a platform admin
   **When** a client bypasses the UI and attempts to write an aporte with a `profile_id` that is not their own
   **Then** the insert is **rejected by RLS**, not merely hidden by the UI (FR40, NFR14)

8. **Given** a tourist
   **When** they attempt to write an aporte by any path
   **Then** the insert is rejected by RLS (FR39, NFR14)

9. **Given** invalid input
   **When** I submit a blank descripcion, a missing fecha, a non-numeric monto, or a `tipo` outside the nine values
   **Then** the form reports it in Spanish and no row is written (FR40, NFR12)

10. **Given** TDD is mandatory
    **When** the story is claimed done
    **Then** failing tests were written first and cover self-load, admin-load, the null monto, and the unauthorized third-party write; `pnpm test` is green (NFR11)

## Tasks / Subtasks

- [ ] **T0 — BLOCKING prerequisite: resolve the Pencil node id** (AC: 1)
  - [ ] `design/nodo-serrano.pen` is **encrypted**. Never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool. Only `mcp__pencil` tools can read it.
  - [ ] Use `mcp__pencil__get_app_state` to locate frame `4.6 · Registrar aporte`; read its contents with the design-context tooling.
  - [ ] Record the resolved node id into `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`, replacing `TBD`.
  - [ ] **This story is not ready for development until this task is done.**
  - [ ] While reading the frame, confirm it contains no payment affordance. If it appears to, raise it — the SPEC's hard line wins.

- [ ] **T1 — Read the framework docs** (AC: 2–9)
  - [ ] Read the App Router / server-actions guide in `node_modules/next/dist/docs/` — breaking changes vs. training data (per `AGENTS.md`).

- [ ] **T2 — RED: failing tests first** (AC: 3, 4, 6, 9, 10)
  - [ ] Action test: self-load writes `profile_id === registrado_por === auth.uid()`.
  - [ ] Action test: empty monto → the insert payload carries `null`, asserted explicitly (`toBeNull()`, not a truthiness check).
  - [ ] Action test: admin-load writes the target `profile_id` with `registrado_por` = the admin.
  - [ ] Action test: a `tipo` outside the nine values is rejected by an allow-list, not cast.
  - [ ] Action tests: blank descripcion, missing fecha, non-numeric monto.
  - [ ] Page test: the four controls render; the tipo selector offers exactly nine options.
  - [ ] Page test: no element with payment copy ("pagar", "cobrar", "checkout", a currency CTA) exists.
  - [ ] Harness cases (real database): third-party write by a non-admin rejected; tourist write rejected.
  - [ ] Verify RED.

- [ ] **T3 — GREEN: the server action** (AC: 3, 4, 6, 9)
  - [ ] `src/features/aportes/actions.ts` with `createAporte`.
  - [ ] Validate `tipo` against an explicit nine-value allow-list, following `oneOf()` in `src/features/tasks/actions.ts`.
  - [ ] Parse monto: empty/whitespace → `null`; otherwise a finite number, else an error. Never `Number("") === 0`.
  - [ ] Self-load: `profile_id = registrado_por = user.id`. Admin-load: `profile_id` from the form, `registrado_por = user.id` — and let RLS be the authority on whether that is allowed.
  - [ ] Spanish error copy in the style of `src/features/tasks/actions.ts`.
  - [ ] `revalidatePath` "Mis aportes" and the member-detail route, then redirect.

- [ ] **T4 — GREEN: the form** (AC: 2, 5)
  - [ ] Route under `src/app/(app)/aportes/new/` (adjust only if the resolved Pencil IA demands it).
  - [ ] Compose from `Input`, `PrimaryButton` and the other DS primitives (NFR17).
  - [ ] The "register for someone else" control is offered only to a platform admin — as ergonomics; RLS is the guard.

- [ ] **T5 — Verify** (AC: 2, 5, 7, 10)
  - [ ] `pnpm test && pnpm typecheck && pnpm lint` green.
  - [ ] Policy harness green; `pnpm db:check-grants` still green.
  - [ ] Visual acceptance: frame `4.6` vs the live route at ~390px.

## Dev Notes

### Current state / problem

After story 6.1 the `aportes` table exists and nothing writes to it. There is no register surface anywhere in the app.

### Approach

A form matching frame `4.6`, a server action validating against the nine-value allow-list, and two write shapes (self-load and admin-load) that differ only in `profile_id` — with the database, not the action, deciding whether the admin-load is permitted.

| Path       | `profile_id` | `registrado_por` | Authorised by                |
| ---------- | ------------ | ---------------- | ---------------------------- |
| Self-load  | `auth.uid()` | `auth.uid()`     | owner clause                 |
| Admin-load | the target   | `auth.uid()`     | `public.is_platform_admin()` |

`profile_id` (whose aporte it is) and `registrado_por` (who typed it in) are different columns on purpose. They are equal for a self-registered aporte and differ for an admin-registered one — never collapse them.

### "admin" means platform admin here

M6 "admin" is `profiles.is_platform_admin`, via `public.is_platform_admin()`. M5's per-project `project_members.rol='admin'` has nothing to do with this screen. Do not cross-wire them.

_"Económicos → Tesorería"_ is an organizational convention, not a policy clause: Tesorería is a _rol_ in `profile_roles`, not a permission axis. Do not gate the form on it.

### `null` vs `0` — the trap

`Number("")` is `0` in JavaScript, and `formData.get("monto")` returns `""` for an untouched input. A naive `Number(formData.get("monto"))` therefore silently turns "no amount" into "an amount of zero", which is a different fact about a person's contribution. Parse explicitly, and assert `toBeNull()` in the test rather than a falsy check — `0` is falsy too.

### Recorded, never charged

> **Aportes are recorded, never charged.** No payment UI, no checkout, no wallet, no "pagar" affordance anywhere in this milestone. `monto` is a number in a ledger.

This is the hard line of M6 and it is checked at the milestone gate (story 6.11). AC 5 is a standing assertion in the test suite, not a one-off review item, so that a later "quick" payment CTA fails a test rather than shipping.

### Files to touch

| Area      | Path                                                             | Notes                                                         |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Spec      | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` | Record the resolved node id for `4.6` (T0)                    |
| NEW       | `src/app/(app)/aportes/new/page.tsx` (+ `page.test.tsx`)         | Register-aporte route                                         |
| NEW       | `src/features/aportes/actions.ts` (+ `actions.test.ts`)          | `createAporte`, nine-value allow-list, monto parsing          |
| NEW       | `src/features/aportes/types.ts`                                  | `AporteTipo` union + the label map (accents live here)        |
| NEW       | `src/features/aportes/AporteForm.tsx`                            | Composed from DS primitives                                   |
| EDIT      | `scripts/check-aportes-rls.harness.ts`                           | Third-party write rejected; tourist rejected                  |
| Prior art | `src/features/tasks/actions.ts`                                  | `oneOf()` allow-list, Spanish error constants, 0-row handling |
| Prior art | `src/features/tasks/TaskForm.tsx`                                | Form composition from DS primitives                           |

### Testing requirements

- **TDD mandatory (NFR11):** failing tests first.
- **The third-party write rejection is a database assertion (NFR14).** A test proving the admin-only control is hidden does not satisfy AC 7.
- Assert `monto` is `null` with `toBeNull()`.
- Assert the tipo selector offers exactly nine options and that the stored values are unaccented.
- Keep a standing assertion that no payment affordance exists on the screen.
- Watch the 0-row trap documented in `src/features/tasks/actions.ts`.
- `pnpm test` green before done.

### Out of scope

- Listing aportes — story 6.3 ("Mis aportes") and story 6.4 (member detail).
- Editing or deleting an aporte — no policy exists; both are denied by design (story 6.1). Raise it rather than building it.
- Puntos Serrano, any `puntos` value, or any scoring of aportes — parked.
- Any payment, checkout, wallet, or on-chain path — parked, and the hard line of this milestone.
- A Tesorería-specific permission gate.
- Attaching receipts or files to an aporte — no frame asks for it.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** open the `.pen` file with a filesystem tool, and do not start before the node id is recorded.
- **Do NOT** collapse `profile_id` and `registrado_por` into one column or one variable.
- **Do NOT** write `Number(formData.get("monto"))` without an explicit empty check.
- **Do NOT** store `0` for a missing amount.
- **Do NOT** cast `formData.get("tipo") as AporteTipo`.
- **Do NOT** store accented enum values.
- **Do NOT** add a payment, checkout, price, or "pagar" affordance, even as a disabled placeholder.
- **Do NOT** rely on hiding the admin control as the authorization.
- **Do NOT** use a project-scoped admin check — M6 admin is `profiles.is_platform_admin`.
- **Do NOT** treat a 0-row PostgREST write as success.

### References

- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR40: An aporte is registered (`4.6`) with tipo, descripcion, fecha, and optional monto; self-load writes `profile_id = registrado_por = auth.uid()`; a platform admin can register for another `profile_id`; a non-admin cannot write someone else's aporte (enforced by RLS)."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** the screen contains no payment, checkout, or \"pagar\" affordance — the aporte is recorded, never charged (FR40, NFR12)"]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "**Aportes are recorded, never charged.** No payment UI, no checkout, no wallet, no \"pagar\" affordance anywhere in this milestone. `monto` is a number in a ledger."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "`aportes.profile_id` (whose aporte it is) and `aportes.registrado_por` (who typed it in) are different columns on purpose."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/data-model.md` — "the enum values are unaccented (`economico`, `donacion`, `prestamo`) even though the Spanish UI labels carry accents — the label is presentation, the enum value is data."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "Tesorería is a **rol**, not a separate permission axis in the data model, so \"económicos → Tesorería\" is read as an organizational convention, not an enforceable policy clause in M6."]
- [Source: `src/features/tasks/actions.ts` — "/** Validates against the enum list instead of blindly casting. */"]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
