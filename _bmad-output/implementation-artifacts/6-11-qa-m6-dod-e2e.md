# Story 6.11: QA — M6 DoD end-to-end on staging

Status: backlog

## Linear

- **ZER-97** — Story 6.11: QA DoD de M6 end-to-end en staging
- URL: https://linear.app/zerrant/issue/ZER-97
- Branch: `juantandil123/zer-97-story-611-qa-dod-de-m6-end-to-end-en-staging`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 6 — Aportes y eventos**
- **Closes both M6 DoD bullets.** This story _is_ the milestone gate: M6 moves to Done on this evidence, not on merged PRs.
- Depends on stories 6.1 → 6.10 (ZER-87 → ZER-96) being deployed to staging.

## Story

As the product owner,
I want the M6 Done criteria demonstrated on staging with real accounts,
so that the milestone is closed on evidence, not on merged PRs.

## Acceptance Criteria

1. **Given** stories 6.1–6.10 deployed to staging against the real tables under RLS
   **When** a serrano registers an aporte and opens their profile
   **Then** _"Se registra un aporte y aparece en el perfil."_ is satisfied — the aporte appears in "Mis aportes" **and** in that person's plantel member detail (FR50, FR41, FR42)

2. **Given** a serrano creates an event and others respond
   **When** serranos B and C set their RSVP and anyone opens the event
   **Then** _"Se crea un evento, la gente confirma y se ve la lista de asistentes."_ is satisfied — the attendee list shows B and C under their chosen `estado` (FR50, FR47, FR48)

3. **Given** B changes their RSVP from `voy` to `no`
   **When** the event is reopened
   **Then** B has moved group and there is still exactly **one** attendance row for B on that event (FR48, FR43)

4. **Given** the in-scope Pencil frames `4.6`, `3.4`, `2.5`, `5.1`, `5.2`, `5.3` and `7.4`
   **When** each is compared against its live staging route at ~390px
   **Then** each is accepted — fail on IA, primary-CTA placement, or key-copy divergence; minor font-hinting/subpixel differences are fine (FR50, UX-DR28)
   **And** every one of those seven node ids is recorded (no longer `TBD`) in `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md` (UX-DR27)

5. **Given** the ZER-50 stub
   **When** `/agenda` is opened on staging
   **Then** the copy _"La agenda de eventos llega en un milestone posterior…"_ is gone, and the `agenda` tab still navigates — **including with JavaScript disabled** (FR44, NFR19, NFR12)

6. **Given** the dead chrome M0–M2 left behind
   **When** the aportes surface is reviewed on staging
   **Then** the profile "Mis aportes" row shows a real count (a real `0` counts) and navigates, and the member-detail "Aportes" section shows real data — no control still renders in its disabled or placeholder form (FR41, FR42, NFR12, UX-DR28)

7. **Given** the hard line of this milestone
   **When** the whole aportes surface is reviewed
   **Then** **no** payment, checkout, wallet, "pagar" or charging affordance exists anywhere — aportes are recorded, never charged (NFR12)

8. **Given** the documentation gap story 6.5 owns
   **When** `docs/roadmap/Seguridad RLS.md` is read
   **Then** it contains the `event_attendance` bullet stating that each person manages their own attendance row (FR43)

9. **Given** the DB-first authorization rule
   **When** the negative paths are probed on staging with real JWTs
   **Then** a tourist can neither read nor write aportes; a non-admin serrano cannot write someone else's aporte; a tourist cannot create an event; a non-creator non-admin serrano can neither update nor delete an event; nobody can write another person's attendance row — each rejected by the database (FR50, NFR14)

10. **Given** the deployed commit
    **When** the gates are run
    **Then** `pnpm test` and `pnpm db:check-grants` are green on that exact commit, and the CI job `db grants (authenticated)` is green (NFR11, NFR13)

11. **Given** the milestone is being closed
    **When** the evidence is recorded
    **Then** the findings live in the Linear issue (screenshots per frame, the JWT/SQL probe output, the commit SHA) — a green local test run is not evidence of a staging DoD (NFR12)

## Tasks / Subtasks

- [ ] **T1 — Preconditions** (AC: 1, 2, 10)
  - [ ] Confirm stories 6.1–6.10 are merged and deployed to staging; record the commit SHA.
  - [ ] Confirm all seven M6 node ids are resolved in `screen-inventory.md` (UX-DR27) — if any still reads `TBD`, the owning story is not done and this QA cannot start.
  - [ ] Prepare real staging accounts: serranos A, B and C, one platform admin, one tourist.

- [ ] **T2 — DoD bullet 1: aporte appears on the profile** (AC: 1, 6)
  - [ ] A registers an aporte with a monto, and a second one **without** a monto.
  - [ ] Verify both appear in "Mis aportes" ordered by `fecha`; the no-monto row shows no amount slot and no `0`.
  - [ ] Verify the profile "Mis aportes" row shows the real count and navigates.
  - [ ] Verify both aportes appear in A's plantel member detail.
  - [ ] Platform admin registers an aporte for A: verify `profile_id` = A and `registrado_por` = the admin, and that it shows on A's surfaces.

- [ ] **T3 — DoD bullet 2: event, RSVP, attendee list** (AC: 2, 3)
  - [ ] A creates an event; verify it appears on its day in the agenda and its detail route resolves.
  - [ ] B sets `voy`, C sets `quizas`. Open the event: both appear under their groups.
  - [ ] B changes to `no`: B moves group and there is still exactly one row for B.
  - [ ] Verify `fin` before `inicio` is rejected on create **and** on edit.
  - [ ] A edits the event: changes persist on the agenda and the detail.
  - [ ] A deletes an event that has RSVPs: it leaves the agenda, its detail route stops resolving, and the attendance rows are gone.

- [ ] **T4 — Negative paths against the database** (AC: 9)
  - [ ] Tourist JWT: read aportes → rejected/empty; write an aporte → rejected; create an event → rejected; write an attendance row → rejected.
  - [ ] Non-admin serrano JWT: insert an aporte with someone else's `profile_id` → rejected.
  - [ ] Non-creator non-admin serrano JWT: update an event → rejected; delete an event → rejected.
  - [ ] Any serrano JWT: insert/update an `event_attendance` row for another `profile_id` → rejected.
  - [ ] Attempt `update` and `delete` on an `aportes` row → rejected (no policy exists, by design).
  - [ ] Record the raw responses; a UI screenshot does not prove any of these.

- [ ] **T5 — Visual acceptance** (AC: 4)
  - [ ] For each of `4.6 · Registrar aporte`, `3.4 · Mis aportes`, `2.5 · Agenda`, `5.1 · Detalle de evento`, `5.2 · Crear evento`, `5.3 · Editar evento`, `7.4 · Vacío Agenda`: open the Pencil frame via `mcp__pencil` next to the live staging route at ~390px and record a pass/fail with a screenshot.
  - [ ] `design/nodo-serrano.pen` is **encrypted** — never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool.

- [ ] **T6 — Stub and dead-chrome sweep** (AC: 5, 6)
  - [ ] `/agenda` serves the real agenda; the stub copy is absent from the deployed bundle.
  - [ ] TabBar `agenda` tab navigates and keeps its active treatment — verified **with JavaScript disabled**, and day selection also works without JavaScript.
  - [ ] Profile "Mis aportes": real count, navigates, no `/40` opacity classes.
  - [ ] Member detail "Aportes": real data or a real empty line — never `"Todavía no hay aportes."` as a hardcoded constant.

- [ ] **T7 — The hard line** (AC: 7)
  - [ ] Walk every aportes screen (`4.6`, `3.4`, member detail) and confirm there is no payment, checkout, wallet, price, or "pagar" affordance — not even disabled or hidden.

- [ ] **T8 — Documentation gate** (AC: 8)
  - [ ] Confirm `docs/roadmap/Seguridad RLS.md` contains the `event_attendance` bullet next to the `events` bullet.

- [ ] **T9 — Gates and report** (AC: 10, 11)
  - [ ] `pnpm test` and `pnpm db:check-grants` green on the deployed commit.
  - [ ] Post the full evidence set to ZER-97: commit SHA, seven frame comparisons, probe outputs, stub/dead-chrome sweep, the payment sweep, the doc check, gate results.
  - [ ] Update `docs/roadmap/PROGRESS.md` only if the milestone actually passes.

## Dev Notes

### Current state / problem

`docs/roadmap/PROGRESS.md` lists M6 as _"🎫 Ticketizado"_ and warns: _"Ticketizado ≠ empezado … pero cero código en `main`."_ This story turns that into Done, and only on staging evidence. Both M6 DoD bullets are written in terms of people doing things against real tables under real policy; nothing in a local Vitest run demonstrates either, because the suite mocks Supabase.

### Approach

A scripted manual pass on staging with five real accounts, direct PostgREST probes for every negative path, a frame-by-frame visual comparison, and three sweeps this milestone specifically requires: the ZER-50 stub, the dead chrome, and the payment hard line.

### Why the negative paths need real JWTs

Every rejection in M6 is a database rule (NFR14). A UI that hides a control proves nothing — the rule under test is what happens when the control is skipped. ZER-43 set the precedent for this repo: prove it with a documented PostgREST/JWT check or local Supabase SQL as the `authenticated` role, not with screenshots.

The probe list in T4 is not optional colour:

| Probe                                            | Policy under test                      |
| ------------------------------------------------ | -------------------------------------- |
| Tourist reads aportes                            | `aportes` SELECT / `is_non_tourist()`  |
| Tourist writes an aporte                         | `aportes` INSERT                       |
| Serrano writes someone else's aporte             | owner-or-platform-admin clause         |
| Update / delete an aporte                        | absence of a policy (denied by design) |
| Tourist creates an event                         | `events` INSERT / `is_non_tourist()`   |
| Non-creator non-admin updates / deletes an event | `creado_por` or `is_platform_admin()`  |
| Anyone writes another person's attendance row    | `event_attendance` own-row-only        |

### Three sweeps unique to M6

1. **The stub.** ZER-50's copy must be gone from the deployed bundle, and the no-JavaScript navigation it existed to guarantee must still work — including the new day strip.
2. **Dead chrome.** The "Mis aportes" row and the member-detail "Aportes" section must show real data, with no `/40` opacity or `—` placeholder left.
3. **The payment line.** _Aportes are recorded, never charged._ No payment, checkout, wallet, or "pagar" affordance anywhere, not even disabled. This is the hard line of the milestone and it is checked here explicitly because a "harmless" disabled CTA is exactly how it would get crossed.

### Not a code story

This story writes no feature code. If it finds a defect, the fix belongs in the owning story's branch (or a new issue), not here. What this story does write: the evidence record, and — if it passes — the `PROGRESS.md` status line.

### Files to touch

| Area      | Path                                                                         | Notes                                                   |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| EDIT      | `docs/roadmap/PROGRESS.md`                                                   | M6 `🎫 Ticketizado` → `✅ Done`, **only** on a pass     |
| VERIFY    | `_bmad-output/specs/spec-m6-aportes-eventos/screen-inventory.md`             | All seven node ids resolved, no `TBD` left              |
| VERIFY    | `docs/roadmap/Seguridad RLS.md`                                              | The `event_attendance` bullet from story 6.5 is present |
| REPORT    | Linear ZER-97                                                                | Screenshots, probe outputs, commit SHA, gate results    |
| RUN       | `pnpm test`, `pnpm db:check-grants`                                          | On the deployed commit                                  |
| Prior art | `_bmad-output/implementation-artifacts/4-x-zer-43-tarifa-hora-visibility.md` | "Verification is not UI-only" + JWT/SQL pattern         |

### Testing requirements

- The gates (`pnpm test`, `pnpm db:check-grants`) run against the **deployed** commit, not a local working tree.
- Every negative AC is proven with a real JWT against staging, and the raw response is recorded.
- The no-JavaScript check is performed, not assumed.
- Every frame comparison is at ~390px with a screenshot attached.
- A partial pass is a fail: the milestone closes when all eleven ACs hold.

### Out of scope

- Writing or fixing feature code. Defects are filed against the owning story.
- Anything in M5 — projects, membership, join requests (story 5.9 is its equivalent gate).
- M7 — cumpleaños, PWA, pulido.
- Performance, load, or accessibility audits.
- Editing story files 6.1–6.10 to make them look complete.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** accept a green `pnpm test` as evidence of the DoD. The suite mocks Supabase.
- **Do NOT** accept a hidden control as proof of a rejection. Probe the database.
- **Do NOT** mark M6 Done with any node id still reading `TBD`.
- **Do NOT** mark M6 Done with the `event_attendance` bullet missing from `docs/roadmap/Seguridad RLS.md`.
- **Do NOT** mark M6 Done with any payment affordance present, disabled or otherwise.
- **Do NOT** mark M6 Done if `/agenda` still serves the ZER-50 copy or breaks without JavaScript.
- **Do NOT** open `design/nodo-serrano.pen` with a filesystem tool.
- **Do NOT** fix defects inside this story's branch.
- **Do NOT** run the pass against a local dev server and call it staging.
- **Do NOT** update `PROGRESS.md` on a partial pass.

### References

- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "> - Se registra un aporte y aparece en el perfil.\n> - Se crea un evento, la gente confirma y se ve la lista de asistentes."]
- [Source: `_bmad-output/specs/spec-m6-aportes-eventos/SPEC.md` — "Demonstrated end-to-end on staging with real accounts, against the real tables under RLS. In addition: `/agenda` no longer serves the stub copy."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** no payment, checkout, or charging affordance exists anywhere in the aportes surface (NFR12)"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "**And** `docs/roadmap/Seguridad RLS.md` contains the `event_attendance` bullet (FR43)"]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR28: … Additionally, fail if any activated control still renders in its disabled/placeholder form."]
- [Source: `_bmad-output/implementation-artifacts/4-x-zer-43-tarifa-hora-visibility.md` — "**Verification is not UI-only.** Prove with a failing-first automated test of the mask contract, plus a documented PostgREST/JWT check."]
- [Source: `docs/roadmap/PROGRESS.md` — "**Ticketizado ≠ empezado:** M5 y M6 tienen SPEC, epics y stories … pero cero código en `main`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
