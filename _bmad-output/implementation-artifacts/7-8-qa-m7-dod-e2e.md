# Story 7.8: QA — M7 DoD end-to-end on staging

Status: backlog

## Linear

- **ZER-105** — Story 7.8: QA DoD de M7 end-to-end en staging
- URL: https://linear.app/zerrant/issue/ZER-105/story-78-qa-dod-de-m7-end-to-end-en-staging
- Branch: `juantandil123/zer-105-story-78-qa-dod-de-m7-end-to-end-en-staging`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- **Closes both M7 DoD bullets.** Milestone moves to Done on this evidence.
- Depends on: 7.1–7.7 (ZER-98 → ZER-104) deployed to staging.
- Labels: qa

## Story

As the product owner,
I want the M7 Done criteria demonstrated on staging,
so that the MVP closes on evidence, not on merged PRs alone.

## Acceptance Criteria

1. **Given** stories 7.1–7.7 on staging
   **When** the app is installed as a PWA on a supported client
   **Then** _"La app se instala como PWA y abre offline el shell."_ is satisfied with recorded evidence (FR61, FR55, FR56)

2. **Given** members with known `fecha_nacimiento` values
   **When** Inicio is opened on staging
   **Then** _"Inicio muestra próximos cumpleaños correctamente."_ is satisfied (age/next occurrence match expectations) (FR61, FR52)

3. **Given** Pencil frames `2.1`, `7.5`, `7.6`
   **When** compared at ~390px on staging
   **Then** each is accepted on IA/CTA/key copy; node ids are no longer `TBD` in screen-inventory (UX-DR34)

4. **Given** TabBar
   **When** reviewed
   **Then** five destinations work including no-JS navigation to Inicio (FR54)

5. **Given** gates
   **When** run on the deployed commit
   **Then** `pnpm test` is green (NFR21)

6. **Given** evidence
   **When** recorded
   **Then** it lives on the Linear issue (install screenshots, offline proof, birthday cases, commit SHA) — local green is not staging DoD (NFR22)

## Tasks / Subtasks

- [ ] Confirm 7.1–7.7 merged + deployed; record SHA
- [ ] Install PWA; go offline; capture shell
- [ ] Verify birthday cases (today, within window, leap policy if fixture exists)
- [ ] Fidelity pass 2.1 / 7.5 / 7.6
- [ ] TabBar five-dest + no-JS spot check
- [ ] Attach evidence; close milestone docs (PROGRESS/STATUS) in the paper-trail follow-up if required by team process

## Out of scope

- Implementing missing features (file bugs instead). Backlog push notifications.
