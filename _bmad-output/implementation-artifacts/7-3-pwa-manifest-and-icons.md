# Story 7.3: PWA manifest + icons

Status: backlog

## Linear

- **ZER-100** — Story 7.3: PWA manifest e íconos
- URL: https://linear.app/zerrant/issue/ZER-100/story-73-pwa-manifest-e-iconos
- Branch: `juantandil123/zer-100-story-73-pwa-manifest-e-iconos`
- Priority: High (P2) · Status: Backlog · Unassigned
- Project: **Nodo Serrano — M7 Cumpleaños, PWA y pulido** · Milestone: **Epic 7 — Cumpleaños, PWA y pulido**

- Depends on: preferably 7.2 (ZER-99) so `start_url` matches Inicio.

## Story

As a member,
I want an installable manifest and icons,
so that Nodo can live on my home screen.

## Acceptance Criteria

1. **Given** the Next 16 app
   **When** this story lands
   **Then** a valid web manifest is served with name/short_name, `start_url`, `display` standalone or minimal-ui, theme/background colors aligned with design tokens, and icons that **do not 404** (FR55, NFR22, NFR23)

2. **Given** icon assets
   **When** installed on a supported browser
   **Then** the install affordance can succeed (evidence: screenshot or browser install UI) (FR55)

3. **Given** TDD/automation where practical
   **When** done
   **Then** at least a smoke test or script asserts manifest JSON shape and icon paths exist on disk; `pnpm test` still green (NFR21)

## Tasks / Subtasks

- [ ] **T1 — Read** Next 16 metadata/manifest docs under `node_modules/next/dist/docs/`
- [ ] **T2 — Assets** in `public/` (real icons, multiple sizes as required)
- [ ] **T3 — Wire** manifest via the supported Next 16 mechanism
- [ ] **T4 — Verify** installability on a mobile browser or desktop install profile

## Out of scope

- Service worker (story 7.4). Push. Maskable icon perfectionism beyond installability.
