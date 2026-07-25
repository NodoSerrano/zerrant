---
id: SPEC-ui-fidelity-m0-m2
companions:
  - screen-inventory.md
  - component-parity.md
  - brownfield.md
  - ../../design/nodo-serrano.pen
  - ../../docs/roadmap/Design system.md
  - ../../docs/roadmap/M0 · Fundación.md
  - ../../docs/roadmap/M1 · Cuenta y perfil.md
  - ../../docs/roadmap/M2 · Nodo — Tasks.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# UI Fidelity M0–M2 (Pencil alignment)

## Why

**Pain:** M0–M2 shipped as functional vibecode. Implemented screens do not match `design/nodo-serrano.pen` (layout, hierarchy, copy, cards, TabBar, CTAs). Operators and members see a different product than the designed backoffice.  
**Mandate now:** freeze feature expansion (M3+) until the visual contract is restored, so every later milestone builds on the real DS instead of compounding debt. Goal is **production**: every change must be shippable, not a disposable prototype.

## Capabilities

- **CAP-1**
  - **intent:** The app theme exposes Pencil design tokens (colors, radii, fonts, light/dark) so UI composition uses the same vocabulary as the design file.
  - **success:** Token names/values in code match Pencil variables for brand, surface, text, border, radii, and display/body fonts; dark tokens exist and theme switch updates surfaces/text; **visual acceptance for screens is light-first** (full dark per-screen pixel QA deferred).

- **CAP-2**
  - **intent:** Shared primitives (Avatar, Chip, PrimaryButton, SecondaryButton, Input, TabBar, TierBadge, RoleChip) render and behave like their Pencil components.
  - **success:** Side-by-side review of each primitive vs Pencil shows matching structure (e.g. PrimaryButton green→blue gradient + shadow; Input pill surface; TabBar icons with active pill; Avatar gradient fallback); component tests cover variants used by in-scope screens.

- **CAP-3**
  - **intent:** Task domain UI uses a TaskCard and empty state matching Pencil, not flat bordered list rows.
  - **success:** Task list renders TaskCard instances matching Pencil fields (icon/category, title, meta, estado, urgency, primary action); empty list matches frame `7.2 · Vacío — Tareas`.

- **CAP-4**
  - **intent:** Auth screens (`1.1`–`1.4`) match Pencil brand layout and Spanish copy while keeping existing auth actions.
  - **success:** Login shows brand mark + “Nodo Serrano” hero, form order and secondary actions as in Pencil; check-email / recovery / reset match structure and CTAs; Google and password flows still work.

- **CAP-5**
  - **intent:** Onboarding steps (`1.5`, `1.6`) match Pencil structure, labels, and **real avatar photo upload** (storage wired, not a dead control).
  - **success:** Step chrome (“Paso N de 2”), titles/subtitles, field set, and primary CTA labels match Pencil; user can upload a photo that persists to profile `avatar_url`; step data still persists via existing actions. **No back control:** onboarding is mandatory and cannot be exited until step 2 is submitted (ZER-13; frame `bvpj5` updated accordingly). Required fields (nombre, apellido, fecha de nacimiento) are marked with an asterisk.

- **CAP-6**
  - **intent:** Serrano profile (`2.6 · Perfil`) is a menu-shell identity screen, not a centered field grid.
  - **success:** Screen shows identity header card, role chips when present, grouped navigation rows (projects/aportes/skills/etc. as designed), theme and session actions; no “Modo lectura” tourist chrome for non-tourists.

- **CAP-7**
  - **intent:** Tourist profile (`2.7 · Perfil (Tourist)`) communicates tourist state and membership path as designed.
  - **success:** Identity card + tier Tourist, green membership banner with designed copy; CTA “Solicitar ser Serrano” is **visible and styled but no-op until M3** (no membership navigation/stub route); short menu (edit/theme/logout as designed); no false serrano-privilege menu items.

- **CAP-8**
  - **intent:** Edit profile (`3.2`) matches Pencil form chrome and controls, including **real avatar change upload**.
  - **success:** Header actions, working avatar change (persists `avatar_url`), fields, and nombre-visible control pattern match Pencil; save persists via existing update action; form shows current profile values.

- **CAP-9**
  - **intent:** Nodo tasks hub (`2.3`), task detail (`4.1`), and create task (`4.2`) match Pencil information architecture.
  - **success:** Hub header “Nodo” with Tareas/Proyectos segmented control; list uses CAP-3 cards + FAB/create pattern from design; detail and create match hierarchy, badges, and primary actions; existing task state transitions still work.

- **CAP-10**
  - **intent:** Visual acceptance is demonstrable per in-scope Pencil frame.
  - **success:** For every frame listed in `screen-inventory.md`, a human (or screenshot diff) can confirm the live route matches the Pencil frame at mobile width without inventing alternate layouts.

## Constraints

- **SSOT UI:** `design/nodo-serrano.pen` is the only visual source of truth. Do not invent layouts, copy, or components that contradict Pencil.
- **Scope freeze:** No M3+ product features and no Pencil redesign in this workstream.
- **Behavior preserve:** Keep existing auth, server actions, RLS, and data model. Change backend only if a fidelity gap is blocked without it (avatar storage is in-scope because upload is required).
- **Production-ready bar:** Implement for production. No intentional tech debt, throwaway vibecode, or “fix later” inside in-scope work. Done means shippable.
- **Engineering rules:** TDD (Vitest + Testing Library); code identifiers in English; user-facing UI strings in Spanish as in Pencil.
- **Known token mismatches to fix:** Primary CTA gradient is green→**blue** (Pencil), not green→mint; TabBar uses designed icons + active pill, not emoji-only inactive chrome.
- **Tourist CTA:** “Solicitar ser Serrano” UI present; behavior no-op until M3.
- **Avatar:** Real upload to storage + `avatar_url` on onboarding and edit profile.
- **Build order:** tokens + primitives → TaskCard → Login → Onboarding (incl. upload) → Profile Tourist/Serrano → Edit profile → Tasks hub/detail/create.

## Non-goals

- Implementing Inicio (`2.1`), Plantel, Agenda, Admin, membership request flow (M3), Projects (M5), Events/Aportes (M6), or other frames outside `screen-inventory.md`.
- Wiring Tourist membership CTA navigation before M3 (UI only / no-op).
- Pixel-perfect StatusBar phone chrome in the web app.
- Rewriting product requirements, data model, or RLS from scratch.
- Building MemberCard/EventCard/ProjectCard/AporteItem/RequestCard beyond what in-scope screens require (TaskCard is required; others only if a listed screen needs them).
- Full dark-mode per-screen pixel QA (token dark parity is required; screen acceptance is light-first).

## Success signal

A reviewer opens each in-scope route at ~390px width next to its Pencil frame and accepts them as the same product UI; primitives are reusable so a new screen can be composed from DS pieces without one-off styling. Functional M0–M2 flows (login, onboarding save, **avatar upload**, profile read, task CRUD/take) still pass tests and are production-deployable.

## Assumptions

- Home (`2.1 · Inicio`) stays out of this fidelity epic; current redirect-to-profile may remain until Inicio is built under its milestone.
- Phone `StatusBar` is design-device chrome only; not required in web shell.
- Nodo hub “Proyectos” control may be a disabled/placeholder shell until M5, if shown for IA fidelity.
- Supabase Storage (or equivalent already in stack) is the avatar backend; bucket/policies are part of finishing CAP-5/CAP-8 properly.
- **Dark mode:** light-first visual acceptance; dark tokens + working theme switch required; per-screen dark pixel QA deferred.
