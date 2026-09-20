# Screen inventory (in-scope)

Pencil SSOT: `design/nodo-serrano.pen`. Mobile frame width **390**.

| Pencil frame            | Node id | App route(s)        | CAP          | Notes                                                      |
| ----------------------- | ------- | ------------------- | ------------ | ---------------------------------------------------------- |
| 4.6 · Registrar aporte  | `h0U2J` | `/aportes/new`      | CAP-2        | tipo, descripcion, fecha, monto optional; own / admin load |
| 3.4 · Mis aportes       | `TBD`   | `/profile/aportes`  | CAP-3        | Clean story from scratch (see note below)                  |
| 2.5 · Agenda            | `TBD`   | `/agenda`           | CAP-6        | Day strip; **replaces the existing stub page**             |
| 5.1 · Detalle de evento | `TBD`   | `/agenda/[id]`      | CAP-8, CAP-9 | Attendee list + RSVP control                               |
| 5.2 · Crear evento      | `TBD`   | `/agenda/new`       | CAP-7        | Any serrano                                                |
| 5.3 · Editar evento     | `TBD`   | `/agenda/[id]/edit` | CAP-10       | Creator or platform admin; delete lives here               |
| 7.4 · Vacío Agenda      | `TBD`   | `/agenda` (empty)   | CAP-6        | Zero-event state                                           |

Routes above are the **expected** shape and may be adjusted to match the Pencil IA once node ids are resolved; the frame column is the binding part.

## Node ids are unresolved — resolve before implementing

Every `Node id` cell reads `TBD` on purpose. The Pencil app was not running when this inventory was written, and `design/nodo-serrano.pen` is **encrypted**: it must never be opened with `Read`, `bat`, `rg`, or any filesystem tool.

**Mandatory step before each UI story:** resolve that frame's node id through the `mcp__pencil` tools (`get_app_state` to find the frame, then the design-context/read tooling for its contents), and record the resolved id back into this table. A UI story that starts without its resolved node id is not ready for development — per `AGENTS.md`, the `.pen` file is the UI source of truth and "Do not invent alternate layouts."

Applies to CAP-2, CAP-3, CAP-6, CAP-7, CAP-8, CAP-9, and CAP-10 stories alike.

## The `/agenda` route already exists as a stub

`src/app/(app)/agenda/page.tsx` was added by **ZER-50** so the `agenda` entry in `src/components/TabBar.tsx` navigates without JavaScript. It currently renders an `<h1>Agenda</h1>` plus placeholder copy — _"La agenda de eventos llega en un milestone posterior…"_.

The agenda story (CAP-6) **replaces** that stub:

- the placeholder copy is deleted, not hidden or conditionally rendered;
- the route path `/agenda` and the `agenda` tab in `TabBar.tsx` are preserved — the tab must keep navigating and keep its active-state treatment;
- no-JavaScript navigation to `/agenda` must still work after the replacement.

## `3.4 · Mis aportes` — prior attempt

This screen was attempted in **PR #27 (ZER-35)**, which was **closed without merging** and deferred to M6. The decision recorded in `SPEC.md`: build it as a **clean story from scratch** against the real `aportes` table. The closed PR is at most a UI reference; it is not reopened, rebased, or cherry-picked.

## Surfaces touched but not owned by a frame

These are existing screens that M6 must un-stub. They have no new Pencil frame of their own; they keep their M0–M2 layout and only gain real data.

| Surface                      | File                                             | Change                                                      |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Perfil · menu row            | `src/app/(app)/profile/SerranoMenu.tsx:64`       | Greyed "Mis aportes" row becomes enabled, with a real count |
| Plantel · detalle de miembro | `src/features/plantel/MemberDetail.tsx:72`       | "Todavía no hay aportes." placeholder becomes a real list   |
| Plantel · detalle test       | `src/features/plantel/MemberDetail.test.tsx:101` | Placeholder assertion updated to the new behavior           |
| Agenda stub                  | `src/app/(app)/agenda/page.tsx`                  | Placeholder page replaced by the real agenda (CAP-6)        |
| TabBar                       | `src/components/TabBar.tsx`                      | No change expected — the `agenda` tab must keep working     |

## Explicitly out of scope (this spec)

All other top-level Pencil frames — Inicio, Plantel, Nodo tasks, Proyectos (`2.4`, `4.3`–`4.5`, `7.3`), Admin, membership request, 404, offline. Proyectos belongs to `SPEC-m5-proyectos`.

## Acceptance method

For each row: open the Pencil frame (via `mcp__pencil`, once the node id is resolved) next to the running route at ~390px width. Fail if layout IA, primary CTA placement, or key copy diverges. Minor font-hinting/subpixel differences OK.

For the "surfaces touched" table: fail if any control still renders in its disabled/placeholder form, or if the ZER-50 stub copy is still reachable at `/agenda`.
