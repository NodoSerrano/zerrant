# Story 7.4: Service worker offline shell

Status: review

## Linear

- **ZER-101** — Story 7.4: Service worker shell offline
- URL: https://linear.app/zerrant/issue/ZER-101/story-74-service-worker-shell-offline
- Branch: `juantandil123/zer-101-story-74-service-worker-shell-offline`
- Priority: High (P2) · Status: In Progress · Assignee: Juan Peñalba
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Unblocks M7 DoD bullet _"La app se instala como PWA y abre offline el shell."_
- Depends on: 7.3 (ZER-100).

## Story

As a member on flaky connectivity,
I want the app shell offline after a prior online visit,
so that I am not stuck on the browser generic offline page.

## Acceptance Criteria

1. **Given** Serwist is preferred (`docs/roadmap/Stack técnico.md`)
   **When** the SW is chosen
   **Then** Serwist is used **or** the PR records why `next-pwa`/alternative was required under Next 16 constraints (FR56, NFR23)

2. **Given** a user visited the app online once (SW installed)
   **When** they open the app offline
   **Then** the **shell** loads (chrome + designed offline/error surface when data cannot load) — not the browser's default offline error alone (FR56)

3. **Given** privacy constraints
   **When** caching is configured
   **Then** authenticated private member directories are **not** cached as a fake offline social graph; static assets + shell routes only unless explicitly justified (FR56, NFR28)

4. **Given** the PR
   **When** it lands
   **Then** the cache/network strategy is documented in the PR body (NFR28)

5. **Given** tests
   **When** done
   **Then** automate what is reasonable (SW registration in production build, manifest still valid); manual offline evidence acceptable and required for QA 7.8 (NFR21)

## Tasks / Subtasks

- [x] **T1 — Spike** Serwist on Next 16 in-repo (read Next docs first)
- [x] **T2 — Implement** SW + precache shell
- [x] **T3 — Verify** offline open after online visit
- [x] **T4 — Document** caching policy in PR

## Completion Notes

- Serwist `@serwist/next` + `serwist` 9.5.x with classic webpack plugin (`next build --webpack` / `next dev --webpack`). Turbopack default on Next 16 does not support this plugin path; documented in PR.
- SW source: `src/app/sw.ts`. Generated `public/sw.js` is gitignored.
- Navigation fallback: public precached `/~offline` reusing AppLayout TabBar chrome (no auth/onboarding gate so SW install can fetch it) with `OfflineShellFallback`.
- Runtime cache: Serwist `defaultCache` plus leading `NetworkOnly` for `/plantel*` and Supabase hosts (no offline social graph).
- Login page wrapped in `Suspense` so webpack production prerender accepts `useSearchParams` (required once Serwist forces `--webpack`).

## Out of scope

- Full offline-first sync. Push. Background sync of RSVP/aportes.
- Pencil-polished system states 7.5/7.6 (ZER-102).
