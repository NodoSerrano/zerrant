# Story 5.9: QA — M5 DoD end-to-end on staging

Status: backlog

## Linear

- **ZER-86** — Story 5.9: QA DoD de M5 end-to-end en staging
- URL: https://linear.app/zerrant/issue/ZER-86
- Branch: `juantandil123/zer-86-story-59-qa-dod-de-m5-end-to-end-en-staging`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M5–M6 Features** · Milestone: **Epic 5 — Proyectos**
- **Closes both M5 DoD bullets.** This story _is_ the milestone gate: M5 moves to Done on this evidence, not on merged PRs.
- Depends on stories 5.1 → 5.8 (ZER-78 → ZER-85) being deployed to staging.

## Story

As the product owner,
I want the M5 Done criteria demonstrated on staging with real accounts,
so that the milestone is closed on evidence, not on merged PRs.

## Acceptance Criteria

1. **Given** stories 5.1–5.8 deployed to staging against the real tables under RLS
   **When** serrano A creates a project with `ingreso='aprobacion'`, serrano B requests to join, and serrano A approves from the queue
   **Then** _"Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba."_ is satisfied and B appears in the project member list (FR38)

2. **Given** a project with `ingreso='abierto'`
   **When** serrano B taps "Unirse"
   **Then** _"En un proyecto abierto, unirse es inmediato."_ is satisfied — B is an approved member with no admin action in between (FR38)

3. **Given** B's request before A approves it
   **When** the project detail is opened by anyone
   **Then** B does not appear in the member list while the row is `pendiente`, and B's own view shows the pending state (FR32, FR33)

4. **Given** the in-scope Pencil frames `2.4`, `4.3`, `4.4`, `4.5` and `7.3`
   **When** each is compared against its live staging route at ~390px
   **Then** each is accepted — fail on IA, primary-CTA placement, or key-copy divergence; minor font-hinting/subpixel differences are fine (FR38, UX-DR28)
   **And** every one of those five node ids is recorded (no longer `TBD`) in `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md` (UX-DR27)

5. **Given** the dead chrome M0–M2 left behind
   **When** the projects surface is reviewed on staging
   **Then** the Nodo Proyectos control, the profile "Mis proyectos" row, and the member-detail "Proyectos" section all show real data, and no control still renders in its disabled or placeholder form (FR29, FR36, FR37, NFR12, UX-DR28)

6. **Given** the DB-first authorization rule
   **When** the negative paths are probed on staging with real JWTs
   **Then** a tourist cannot create or join a project, a non-admin of a project cannot approve a request or promote a member, and a client bypassing the server action cannot self-insert `estado='aprobado'` into an `aprobacion` project — each rejected by the database (FR38, NFR14)

7. **Given** the deployed commit
   **When** the gates are run
   **Then** `pnpm test` and `pnpm db:check-grants` are green on that exact commit, and the CI job `db grants (authenticated)` is green (NFR11, NFR13)

8. **Given** the milestone is being closed
   **When** the evidence is recorded
   **Then** the findings live in the Linear issue (screenshots per frame, the JWT/SQL probe output, the commit SHA) — a green local test run is not evidence of a staging DoD (NFR12)

## Tasks / Subtasks

- [ ] **T1 — Preconditions** (AC: 1, 2, 7)
  - [ ] Confirm stories 5.1–5.8 are merged and deployed to staging; record the commit SHA.
  - [ ] Confirm all five M5 node ids are resolved in `screen-inventory.md` (UX-DR27) — if any still reads `TBD`, the owning story is not done and this QA cannot start.
  - [ ] Prepare two real staging accounts: serrano A and serrano B, plus one tourist account.

- [ ] **T2 — DoD bullet 1: approval door** (AC: 1, 3)
  - [ ] A creates a project with `ingreso='aprobacion'`.
  - [ ] Verify A is seated immediately as `rol='admin'`, `estado='aprobado'`.
  - [ ] B opens the detail: the affordance reads "Solicitar ingreso". B taps it.
  - [ ] Verify B's row is `pendiente`, B is absent from the member list, and B's view shows the pending state.
  - [ ] A opens the queue, sees B, approves. Verify B is now in the member list.
  - [ ] Also exercise reject once: the row disappears and that person can request again.

- [ ] **T3 — DoD bullet 2: open door** (AC: 2)
  - [ ] A creates a project with `ingreso='abierto'`.
  - [ ] B taps "Unirse". Verify B is an approved member immediately, with no admin action.

- [ ] **T4 — Governance** (AC: 6)
  - [ ] A promotes B to `rol='admin'`. Verify B can open the queue and edit config.
  - [ ] Verify a plain `miembro` cannot.

- [ ] **T5 — Negative paths against the database** (AC: 6)
  - [ ] Tourist JWT: create project → rejected; join project → rejected.
  - [ ] Non-admin serrano JWT: approve a request → rejected; promote a member → rejected.
  - [ ] **Platform admin who is not a project admin**: approve → rejected (M5 "admin" is per-project, never `profiles.is_platform_admin`).
  - [ ] Direct PostgREST insert of `estado='aprobado'` into an `aprobacion` project → rejected by the `WITH CHECK` clause.
  - [ ] Direct insert with someone else's `profile_id` → rejected.
  - [ ] Record the raw responses; a UI screenshot does not prove any of these.

- [ ] **T6 — Visual acceptance** (AC: 4)
  - [ ] For each of `2.4 · Nodo — Proyectos`, `4.3 · Detalle de proyecto`, `4.4 · Crear proyecto`, `4.5 · Solicitudes de ingreso`, `7.3 · Vacío Proyectos`: open the Pencil frame via `mcp__pencil` next to the live staging route at ~390px and record a pass/fail with a screenshot.
  - [ ] `design/nodo-serrano.pen` is **encrypted** — never open it with `Read`, `bat`, `rg`, `fd` or any filesystem tool.

- [ ] **T7 — Dead-chrome sweep** (AC: 5)
  - [ ] Nodo hub: the Proyectos half navigates and is not a `<span … cursor-default>`.
  - [ ] Profile: "Mis proyectos" shows a real count (a real `0` counts) and navigates; no `/40` opacity classes remain on it.
  - [ ] Plantel member detail: the "Proyectos" section lists real projects or a real empty line — never `"Todavía no hay proyectos."` as a hardcoded constant.
  - [ ] Confirm no-JavaScript navigation still works for the TabBar and the Nodo segmented control.

- [ ] **T8 — Gates and report** (AC: 7, 8)
  - [ ] `pnpm test` and `pnpm db:check-grants` green on the deployed commit.
  - [ ] Post the full evidence set to ZER-86: commit SHA, five frame comparisons, probe outputs, dead-chrome sweep, gate results.
  - [ ] Update `docs/roadmap/PROGRESS.md` only if the milestone actually passes.

## Dev Notes

### Current state / problem

`docs/roadmap/PROGRESS.md` currently lists M5 as _"🎫 Ticketizado"_ and warns: _"Ticketizado ≠ empezado … pero cero código en `main`."_ This story is what turns that into Done — and only on staging evidence. The M5 DoD is written in terms of two people doing two things against real tables under real policy; nothing in a local Vitest run can demonstrate either, because the suite mocks Supabase.

### Approach

A scripted manual pass on staging with three real accounts (serrano A, serrano B, one tourist), plus direct PostgREST probes for every negative path, plus a frame-by-frame visual comparison. Evidence goes into the Linear issue.

### Why the negative paths need real JWTs

Every rejection in M5 is a database rule (NFR14). A UI that hides a button proves nothing — the rule under test is what happens when the button is skipped. The ZER-43 story established the precedent for this repo: prove the mask with a documented PostgREST/JWT check or local Supabase SQL as the `authenticated` role, not with screenshots.

The probe list in T5 is not optional colour. Each entry maps to a policy that would otherwise only be tested against a mocked client:

| Probe                                               | Policy under test                      |
| --------------------------------------------------- | -------------------------------------- |
| Tourist creates a project                           | `projects` INSERT / `is_non_tourist()` |
| Tourist joins                                       | `project_members` INSERT               |
| Non-admin approves                                  | `project_members` UPDATE               |
| Platform admin (not project admin) approves         | admin scoping (FR28)                   |
| Self-insert `aprobado` into an `aprobacion` project | the `ingreso` door `WITH CHECK`        |
| Insert with another person's `profile_id`           | self-join only                         |

### Not a code story

This story writes no feature code. If it finds a defect, the fix belongs in the owning story's branch (or a new issue), not in this one. What this story does write: the evidence record, and — if it passes — the `PROGRESS.md` status line.

### Files to touch

| Area      | Path                                                                         | Notes                                                 |
| --------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| EDIT      | `docs/roadmap/PROGRESS.md`                                                   | M5 `🎫 Ticketizado` → `✅ Done`, **only** on a pass   |
| VERIFY    | `_bmad-output/specs/spec-m5-proyectos/screen-inventory.md`                   | All five node ids resolved, no `TBD` left             |
| REPORT    | Linear ZER-86                                                                | Screenshots, probe outputs, commit SHA, gate results  |
| RUN       | `pnpm test`, `pnpm db:check-grants`                                          | On the deployed commit                                |
| Prior art | `_bmad-output/implementation-artifacts/4-x-zer-43-tarifa-hora-visibility.md` | "Verification is not UI-only" + JWT/SQL proof pattern |

### Testing requirements

- The gates (`pnpm test`, `pnpm db:check-grants`) run against the **deployed** commit, not a local working tree.
- Every negative AC is proven with a real JWT against staging, and the raw response is recorded.
- Every frame comparison is at ~390px with a screenshot attached.
- A partial pass is a fail: the milestone closes when all eight ACs hold.

### Out of scope

- Writing or fixing feature code. Defects are filed against the owning story.
- Anything in M6 — aportes, events, agenda, RSVP (story 6.11 is its equivalent gate).
- Performance, load, or accessibility audits — no NFR in this epic asks for them.
- Editing story files 5.1–5.8 to make them look complete.

### Implementation guardrails (anti-patterns) / Do NOT

- **Do NOT** accept a green `pnpm test` as evidence of the DoD. The suite mocks Supabase.
- **Do NOT** accept a hidden button as proof of a rejection. Probe the database.
- **Do NOT** mark M5 Done with any node id still reading `TBD` in `screen-inventory.md`.
- **Do NOT** mark M5 Done with any control still in its disabled/placeholder form.
- **Do NOT** open `design/nodo-serrano.pen` with a filesystem tool.
- **Do NOT** fix defects inside this story's branch.
- **Do NOT** run the pass against a local dev server and call it staging.
- **Do NOT** update `PROGRESS.md` on a partial pass.

### References

- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "> - Un serrano crea un proyecto por aprobación; otro solicita y el admin lo aprueba.\n> - En un proyecto abierto, unirse es inmediato."]
- [Source: `_bmad-output/specs/spec-m5-proyectos/SPEC.md` — "Demonstrated end-to-end on staging with two real accounts, against the real tables under RLS."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "FR38: The M5 DoD is demonstrated end-to-end on staging against real tables under RLS."]
- [Source: `_bmad-output/planning-artifacts/epics-m5-m6.md` — "UX-DR28: Acceptance method — Pencil frame vs live route at ~390px; fail on IA, primary-CTA placement, or key-copy divergence … Additionally, fail if any activated control still renders in its disabled/placeholder form."]
- [Source: `_bmad-output/implementation-artifacts/4-x-zer-43-tarifa-hora-visibility.md` — "**Verification is not UI-only.** Prove with a failing-first automated test of the mask contract, plus a documented PostgREST/JWT check."]
- [Source: `docs/roadmap/PROGRESS.md` — "**Ticketizado ≠ empezado:** M5 y M6 tienen SPEC, epics y stories … pero cero código en `main`."]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
