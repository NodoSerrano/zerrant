# Screen inventory (in-scope)

Pencil SSOT: `design/nodo-serrano.pen`. Mobile frame width **390**.

| Pencil frame                 | Node id | App route(s)                   | CAP          | Notes                                                             |
| ---------------------------- | ------- | ------------------------------ | ------------ | ----------------------------------------------------------------- |
| 2.4 · Nodo — Proyectos       | `K3qRs` | `/nodo/projects`               | CAP-2        | Sub-tab of the Nodo hub; shares the Tareas/Proyectos control      |
| 4.3 · Detalle de proyecto    | `TBD`   | `/nodo/projects/[id]`          | CAP-4, CAP-5 | Estado, miembros, admins, join affordance                         |
| 4.4 · Crear proyecto         | `fyS2B` | `/nodo/projects/new`           | CAP-3        | nombre, descripcion, `estado`, `ingreso` (`4.4 · Crear proyecto`) |
| 4.5 · Solicitudes de ingreso | `TBD`   | `/nodo/projects/[id]/requests` | CAP-6        | Project-admin only; approve / reject `pendiente` rows             |
| 7.3 · Vacío Proyectos        | `wzIj2` | `/nodo/projects` (empty)       | CAP-2        | Zero-project state (`7.3 · Vacío — Proyectos`)                    |

Routes above are the **expected** shape and may be adjusted to match the Pencil IA once node ids are resolved; the frame column is the binding part.

## Node ids are unresolved — resolve before implementing

Every `Node id` cell reads `TBD` on purpose. The Pencil app was not running when this inventory was written, and `design/nodo-serrano.pen` is **encrypted**: it must never be opened with `Read`, `bat`, `rg`, or any filesystem tool.

**Mandatory step before each UI story:** resolve that frame's node id through the `mcp__pencil` tools (`get_app_state` to find the frame, then the design-context/read tooling for its contents), and record the resolved id back into this table. A UI story that starts without its resolved node id is not ready for development — per `AGENTS.md`, the `.pen` file is the UI source of truth and "Do not invent alternate layouts."

Applies to CAP-2, CAP-3, CAP-4, CAP-5, and CAP-6 stories alike.

## Surfaces touched but not owned by a frame

These are existing screens that M5 must un-stub (CAP-7). They have no new Pencil frame of their own; they keep their M0–M2 layout and only gain real data.

| Surface                      | File                                             | Change                                                             |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| Nodo hub segmented control   | `src/app/(app)/nodo/tasks/page.tsx:84`           | Dead `<span … cursor-default>Proyectos</span>` becomes a real link |
| Perfil · menu row            | `src/app/(app)/profile/SerranoMenu.tsx:55`       | Greyed "Mis proyectos" row becomes enabled, with a real count      |
| Plantel · detalle de miembro | `src/features/plantel/MemberDetail.tsx:78`       | "Todavía no hay proyectos." placeholder becomes a real list        |
| Plantel · detalle test       | `src/features/plantel/MemberDetail.test.tsx:101` | Placeholder assertion updated to the new behavior                  |

## Explicitly out of scope (this spec)

All other top-level Pencil frames — Inicio, Plantel, Agenda (`2.5`), Aportes (`3.4`, `4.6`), Events (`5.1`–`5.3`), `7.4 · Vacío Agenda`, Admin, membership request, 404, offline. Aportes and events belong to `SPEC-m6-aportes-eventos`.

## Acceptance method

For each row: open the Pencil frame (via `mcp__pencil`, once the node id is resolved) next to the running route at ~390px width. Fail if layout IA, primary CTA placement, or key copy diverges. Minor font-hinting/subpixel differences OK.

For the "surfaces touched" table: fail if any control still renders in its disabled/placeholder form once its backing data exists.
