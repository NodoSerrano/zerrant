---
id: SPEC-m7-cumpleanos-pwa-pulido
companions:
  - screen-inventory.md
  - data-model.md
  - ../../design/nodo-serrano.pen
  - ../../docs/roadmap/M7 · Cumpleaños, PWA y pulido.md
  - ../../docs/roadmap/Stack técnico.md
  - ../../docs/roadmap/Modelo de datos.md
  - ../../docs/roadmap/Glosario.md
  - ../../docs/superpowers/specs/2026-07-20-nodo-serrano-backoffice-design.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# M7 · Cumpleaños, PWA y pulido

## Why

**Pain:** The MVP still has no home dashboard. `/` only redirects to `/profile`. The TabBar lost **Inicio** (ZER-67) because that destination was a lie. Birthdays are already collected in onboarding (`profiles.fecha_nacimiento`) but never surface. The product is still a plain website: no installable PWA, no offline shell, no designed 404/offline states. Dark mode tokens exist from M0, but a full polish pass across shipped screens was never a milestone gate.

**Mandate now:** Close the MVP. M7 delivers (1) **Inicio** with upcoming events + upcoming birthdays, (2) an **installable PWA** with offline shell, (3) **system states** (offline/error, 404, loading), (4) **dark-mode polish**, and (5) a bounded **a11y + Core Web Vitals** pass. Goal is **production**: the app installs, opens offline to the shell, and Inicio shows real next birthdays.

**Dependencies (Roadmap graph):** M2, M4, M5, M6 → M7. Inicio needs the `events` table from M6. Ticketization may proceed while the last M5/M6 PRs merge; **implementation of Inicio must not start until events are readable on the target branch/staging**.

## Capabilities

### Cumpleaños + Inicio

- **CAP-1**
  - **intent:** Pure domain helpers compute age and the next upcoming birthdays from `profiles.fecha_nacimiento` without inventing a new table.
  - **success:** A pure TypeScript module (Vitest-covered) returns age for a birth date and a sorted list of upcoming birthdays in a defined window (default: next 30 days, including "today"); handles leap-day birthdays without crashing; null `fecha_nacimiento` is excluded; display name uses the same visible-name rules as plantel/profile.

- **CAP-2**
  - **intent:** Inicio (`2.1`) is a real hub: próximos eventos + próximos cumpleaños.
  - **success:** Authenticated users who finished onboarding land on Inicio instead of being bounced straight to `/profile`; the screen lists upcoming events from `events` and upcoming birthdays from CAP-1; empty sections have honest empty copy (not fake rows); the screen matches frame `2.1 · Inicio` at ~390px once the Pencil node id is resolved.

- **CAP-3**
  - **intent:** The TabBar recovers the **Inicio** destination that ZER-67 removed for honesty.
  - **success:** `TabBar` again has five destinations — Inicio · Plantel · Nodo · Agenda · Perfil — with Inicio as a real `<Link href="/">` (or the chosen Inicio path if IA resolves otherwise); no-JS navigation works; active-pill treatment works on Inicio; the prior four tabs do not regress.

### PWA

- **CAP-4**
  - **intent:** The app is installable: web app manifest + icons.
  - **success:** A valid web manifest is served (name, short_name, start_url, display standalone/minimal-ui, theme/background colors aligned with the design system, icons at required sizes); install affordance works on a supported mobile browser; icons are real assets under `public/`, not placeholders that 404.

- **CAP-5**
  - **intent:** Offline shell via service worker (Serwist preferred; `next-pwa` acceptable if Serwist is blocked by Next 16 constraints — decision recorded in the story PR).
  - **success:** After a first online visit, a subsequent offline open loads the app shell (chrome + a designed offline/error state) rather than the browser's generic offline page; the SW does **not** invent cached private member data as a substitute for the network; update strategy is documented in the PR.

### Estados de sistema + pulido

- **CAP-6**
  - **intent:** Designed 404 (`7.6`) and offline/error (`7.5`) states replace framework defaults where the app owns the surface.
  - **success:** Unknown app routes render the Pencil 404; offline/error surfaces match `7.5`; loading/skeleton treatment exists for the primary hub fetches that M7 owns (at minimum Inicio sections); copy is Spanish and matches Pencil key labels once node ids are resolved.

- **CAP-7**
  - **intent:** Dark-mode polish pass across shipped screens.
  - **success:** A documented checklist of primary shells (auth, onboarding, plantel, nodo, agenda, profile, admin, Inicio, system states) is reviewed in `.dark`; regressions against token misuse (hard-coded light-only colors, unreadable contrast, broken neumorphic surfaces) are fixed in-scope; no new alternate palette is invented — tokens from story 1.1 remain SSOT.

- **CAP-8**
  - **intent:** Bounded accessibility and performance pass (Core Web Vitals minded).
  - **success:** Tab/keyboard reachability on Inicio and system states; images/icons have appropriate alt/sizes; LCP/CLS obvious foot-guns introduced by M7 (huge unoptimized icons, layout shift from late birthday/event slots) are fixed; the pass is a checklist with evidence, not an unbounded rewrite of the app.

- **CAP-9**
  - **intent:** M7 DoD is demonstrated end-to-end.
  - **success:** Staging evidence that (1) the app installs as a PWA and opens offline to the shell, and (2) Inicio shows upcoming birthdays correctly — matching `docs/roadmap/M7 · Cumpleaños, PWA y pulido.md` DoD verbatim.

## Constraints

- **SSOT UI:** `design/nodo-serrano.pen` is the only visual source of truth. Node ids for M7 frames start as `TBD` and must be resolved via `mcp__pencil` before each UI story. Never open the `.pen` with filesystem tools.
- **No new birthday table.** Birthdays derive from existing `profiles.fecha_nacimiento`. No push/reminder jobs.
- **Events are read-only input from M6.** M7 does not redesign agenda/create/RSVP.
- **PWA privacy:** Offline shell ≠ offline private directory. Do not cache authenticated plantel/profile payloads as a fake offline social graph unless a later explicit decision says so (not in MVP).
- **Production-ready bar:** No "fix later" inside in-scope work; no fake birthday rows; no manifest that points at missing icons.
- **Engineering rules:** TDD (Vitest + Testing Library). `pnpm test` green before any story is claimed done. Read Next 16 docs under `node_modules/next/dist/docs/` before PWA wiring — this is not the Next.js of training data.
- **Behavior preserve:** Auth, onboarding gate, plantel, tasks, projects, aportes, agenda must not regress when Inicio and TabBar change.
- **Build order:** birthday pure lib → Inicio + TabBar → manifest/icons → service worker → system states → dark polish → a11y/perf → QA DoD.

## Non-goals

Parked in `docs/roadmap/Backlog.md` — do not implement or scaffold:

- **Push notifications** (event or birthday reminders).
- **Puntos Serrano**, on-chain payments, chat, project budgets/invoicing.
- Full offline-first sync of domain data.
- Redesign of M0–M6 product flows beyond dark/a11y fixes discovered in the polish pass.
- Replacing the design-token system.

## Success signal

The milestone DoD from `docs/roadmap/M7 · Cumpleaños, PWA y pulido.md`, verbatim:

> - La app se instala como PWA y abre offline el shell.
> - Inicio muestra próximos cumpleaños correctamente.
