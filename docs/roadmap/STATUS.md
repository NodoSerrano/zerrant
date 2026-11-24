# STATUS — Nodo Serrano (zerrant)

> Documento operativo de reanudación.
> **No reemplaza** el PRD ni las stories BMad: resume dónde estamos, qué hay en cada branch/ambiente y qué hacer después.
> Actualizar este archivo cuando cambie el estado real (merges a `develop`, releases a `main`, cierres Linear).

| Campo                     | Valor                                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corte                     | 2026-11-24                                                                                                                                                             |
| Repo                      | `NodoSerrano/zerrant`                                                                                                                                                  |
| Branch `prod` (`main`)    | `main` @ `0a01261` (`release: develop to main (v0.1.0, 2026-10-16)`)                                                                                                   |
| Branch `test` (`develop`) | `origin/develop` @ `ed920a5` (+98 commits · 30 tickets `Ready for Deploy`)                                                                                             |
| Linear (workspace `ZER`)  | https://linear.app/zerrant (225 issues totales)                                                                                                                        |
| Plantillas de issues      | [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) · [`docs/templates/linear-issue-templates.md`](../templates/linear-issue-templates.md)                      |
| Diagramas de estado       | [`zerrant-project-status.html`](diagrams/zerrant-project-status.html) (Kanban) · [`zerrant-release-topology.html`](diagrams/zerrant-release-topology.html) (Git graph) |
| Diseño SSOT               | `design/nodo-serrano.pen`                                                                                                                                              |
| Stories BMad              | `_bmad-output/implementation-artifacts/`                                                                                                                               |
| Sprint map                | `_bmad-output/implementation-artifacts/sprint-status.yaml` (reconciliado 2026-11-24)                                                                                   |
| Deuda diferida            | `_bmad-output/implementation-artifacts/deferred-work.md` (reconciliado 2026-11-24)                                                                                     |

---

## 1. En una frase

**M0–M7 ya están implementados en `main` (`v0.1.0-2026-10-16`)** (133 issues `Done`, 20 `Canceled`; solo quedan en Backlog los QA E2E de M5 `ZER-86` y M7 `ZER-105`), **`origin/develop` acumula 30 tickets `Ready for Deploy`** (98 commits y 11 migraciones SQL por delante de `main`), hay **2 PRs abiertos en revisión** (`#166` `ZER-202`, `#167` `ZER-225`) y **2 tickets `In Progress`** sin branch remoto aún (`ZER-192`, `ZER-144`).

---

## 2. Qué es y cómo corre

PWA mobile-first, backoffice de la comunidad Nodo Serrano. Un serrano se define por **Tier** (aporte económico) y **Rol** (aporte comunitario).

| Capa    | Elección                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------- |
| App     | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4                                                        |
| Backend | Supabase (Auth, Postgres, RLS, Storage)                                                                                 |
| Deploy  | VPS self-hosted vía Docker Compose (`.github/workflows/deploy.yml`: `develop` → `test`, `main` → `prod`)                |
| CI      | GitHub Actions (`.github/workflows/ci.yml` en PRs a `main` y `develop`: `typecheck`, `lint`, `test`, `db:check-grants`) |
| Tests   | Vitest + Testing Library · `oxlint` + `oxfmt`                                                                           |
| Proceso | BMad Method + Linear (`ZER-*`) · TDD obligatorio · fidelity vs Pencil                                                   |

Docs canónicos del producto: esta carpeta (`docs/roadmap/`), glosario, modelo de datos, RLS, stack, design system, backlog.

---

## 3. Estado real por milestone (código en `main` vs `develop`)

Leyenda: **Done** = feature + QA cerrados en `main` · **Implementado (QA pendiente)** = feature en `main`, ticket QA E2E abierto en Backlog.

| Milestone                      | Docs (README/PROGRESS)                | Realidad en `main` (`v0.1.0`)      | Notas                                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 Fundación**               | Done                                  | **Done**                           | Scaffold, tokens, Supabase, CI/deploy                                                                                                                                                                                                     |
| **M1 Cuenta y perfil**         | Done                                  | **Done**                           | Auth, onboarding step1/2, profile edit, recovery/reset/check-email                                                                                                                                                                        |
| **M2 Nodo — Tasks**            | Done                                  | **Done**                           | Hub, create, detail, edit, asignar/tomar/liberar, RLS split (`ZER-42`), `develop` suma categorías/filtros (`ZER-208`, `ZER-209`, `ZER-210`, `ZER-225`)                                                                                    |
| **M3 Membresía y roles**       | Done                                  | **Done**                           | Solicitud `/solicitar` + screening (`ZER-108`/`109`), entrevista (`ZER-142`/`143`), admin membresías y roles, QA `ZER-63` Done. `develop` suma re-solicitud (`ZER-180`), `ZER-144` en progreso                                            |
| **M4 Plantel y directorio**    | Done                                  | **Done**                           | Listado + filtros, detalle, habilidades, QA `ZER-64` Done. `develop` simplifica habilidades a nombre (`ZER-163`/`ZER-216`)                                                                                                                |
| **M5 Proyectos**               | Implementado (QA `ZER-86` pendiente)  | **En `main`** (`ZER-78..85` Done)  | Hub, crear, detalle, join abierto/aprobación, cola de solicitudes, admins. `develop` suma ingreso cerrado (`ZER-151`), archivados (`ZER-201`), salir/quitar admin (`ZER-199`/`200`), botones (`ZER-224`); en review `ZER-202` (PR `#166`) |
| **M6 Aportes y eventos**       | Done                                  | **Done** (`ZER-87..97` Done)       | Aportes + Mis aportes (`/profile/aportes`), Agenda, eventos, RSVP, QA `ZER-97` Done. `develop` suma donaciones materiales (`ZER-166`)                                                                                                     |
| **M7 Cumpleaños, PWA, pulido** | Implementado (QA `ZER-105` pendiente) | **En `main`** (`ZER-98..104` Done) | Inicio (`/`), cumpleaños, manifest + Serwist offline shell, 404/offline, dark mode, a11y/perf. `develop` agrega 5ª tab `Actividad` (`ZER-206`)                                                                                            |
| **Backlog**                    | Parked                                | Parked                             | Puntos Serrano, push, chat, facturación, pagos on-chain — ver `Backlog.md`                                                                                                                                                                |

### 3.1 Rutas en `main` (`v0.1.0`, 37 páginas)

- **Auth & entrada:** `/auth/login`, `/auth/signup`, `/auth/check-email`, `/auth/recovery`, `/auth/reset-password`, `/unirme`
- **Onboarding:** `/onboarding/step1`, `/onboarding/step2`
- **Inicio & Agenda:** `/` (Inicio), `/agenda`, `/agenda/new`, `/agenda/[id]`, `/agenda/[id]/edit`
- **Perfil & Membresía:** `/profile`, `/profile/edit`, `/profile/habilidades`, `/profile/aportes`, `/profile/proyectos`, `/aportes/new`, `/solicitar`, `/solicitar/entrevista`, `/solicitar/enviado`, `/solicitar/estado`
- **Admin:** `/admin/membresias`, `/admin/roles`
- **Plantel:** `/plantel`, `/plantel/[id]`
- **Nodo (Tareas & Proyectos):** `/nodo/tasks`, `/nodo/tasks/new`, `/nodo/tasks/[id]`, `/nodo/tasks/[id]/edit`, `/nodo/projects`, `/nodo/projects/new`, `/nodo/projects/[id]`, `/nodo/projects/[id]/edit`, `/nodo/projects/[id]/requests`
- **Sistema:** `/~offline`

### 3.2 Rutas nuevas en `origin/develop` (`Ready for Deploy`, +5 páginas → 42 total)

- `/admin/donaciones` (`ZER-166`)
- `/admin/habilidades` (`ZER-163` / `ZER-216`)
- `/donaciones` y `/donaciones/new` (`ZER-166`)
- `/ser-serrano` (`ZER-191`)
- Además, `TabBar` (`src/components/TabBar.tsx`) agrega la 5ª tab **`Actividad`** (`/nodo/projects`) visible solo para miembros (`ZER-206`).

### 3.3 Dominios en `src/features/` y Migraciones

- **`main` (14 dominios · 40 migraciones SQL):** `a11y-perf`, `admin`, `aportes`, `auth`, `events`, `home`, `membership`, `plantel`, `profile`, `projects`, `pwa`, `roles`, `system-states`, `tasks`.
- **`origin/develop` (15 dominios · 51 migraciones SQL):** suma `donaciones` (`ZER-166`) y **+11 migraciones** (`zer160`, `zer166` ×3, `zer199`, `zer200`, `zer163`, `zer201`, `zer208`, `zer151`, `zer180`, `zer216`).

---

## 4. Cola de PRs, `Ready for Deploy` e `In Progress` (corte 2026-11-24)

### 4.1 PRs abiertos en GitHub (2 — ambos hacia `develop`, CI passing, `review-required`)

| PR                                                      | Issue Linear                                                                                                             | Autor           | Título                                                             | Última act. |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------ | ----------- |
| [#166](https://github.com/NodoSerrano/zerrant/pull/166) | [ZER-202](https://linear.app/zerrant/issue/ZER-202/solicitudes-a-proyectos-motivo-de-rechazo-notificacion-y-pendientes)  | `martiyaquinta` | `feat(projects): join reject motivo and Inicio notices (ZER-202)`  | 2026-11-05  |
| [#167](https://github.com/NodoSerrano/zerrant/pull/167) | [ZER-225](https://linear.app/zerrant/issue/ZER-225/tareas-filtro-por-defecto-abierta-todas-aparte-y-colores-de-urgencia) | `martiyaquinta` | `feat(tasks): default abierta filter and separate todas (ZER-225)` | 2026-11-05  |

### 4.2 Tickets en `Ready for Deploy` (30 — mergeados en `origin/develop`, pendientes de release a `main`)

`ZER-151`, `ZER-160`, `ZER-163`, `ZER-166`, `ZER-176`, `ZER-180`, `ZER-191`, `ZER-194`, `ZER-197`, `ZER-199`, `ZER-200`, `ZER-201`, `ZER-204`, `ZER-205`, `ZER-206`, `ZER-207`, `ZER-208`, `ZER-209`, `ZER-210`, `ZER-211`, `ZER-212`, `ZER-213`, `ZER-214`, `ZER-215`, `ZER-216`, `ZER-220`, `ZER-221`, `ZER-222`, `ZER-223` (vinculado a PR `#164`), `ZER-224`.

### 4.3 Tickets `In Progress` (2 — sin PR ni branch remoto pusheado)

| Issue Linear                                                                                                         | Assignee            | Título                                                                             | Última act. |
| -------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- | ----------- |
| [ZER-192](https://linear.app/zerrant/issue/ZER-192/versionado-de-test-historial-solo-para-quien-inicio-sesion-en-el) | `fabrizioleali2205` | Versionado de test: historial solo para quien inició sesión en el ambiente de test | 2026-10-19  |
| [ZER-144](https://linear.app/zerrant/issue/ZER-144/reprogramar-la-entrevista-sin-rechazar-a-la-persona)              | `agustindxm`        | Reprogramar la entrevista sin rechazar a la persona                                | 2026-10-17  |

---

## 5. Censo Linear ↔ Repo (reconciliado 2026-11-24)

| Estado en Linear   | Cantidad | Estado real                                                                              |
| ------------------ | -------- | ---------------------------------------------------------------------------------------- |
| `Done`             | **133**  | En `main` (`v0.1.0`)                                                                     |
| `Canceled`         | **20**   | Descartados / duplicados                                                                 |
| `Ready for Deploy` | **30**   | Mergeados en `origin/develop` (ambiente `test`)                                          |
| `In Review`        | **2**    | PRs `#166` (`ZER-202`) y `#167` (`ZER-225`) hacia `develop`                              |
| `In Progress`      | **2**    | `ZER-192` y `ZER-144` (sin PR abierto)                                                   |
| `Todo`             | **0**    | —                                                                                        |
| `Backlog`          | **38**   | 9 EPICs (`ZER-125`–`ZER-134`), QA M5/M7 (`ZER-86`, `ZER-105`), ops (`ZER-72`) y 26 items |

**Reconciliación 2026-11-24:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` y los 27 story `.md` desactualizados (M5–M7 + `zer-136`, `zer-138`, `zer-143`) quedaron alineados con Linear y `main`.
- `README.md`, `PROGRESS.md`, `Roadmap.md`, `M5..M7`, `Stack técnico.md`, `Design system.md`, `Modelo de datos.md` y `AGENTS.md` quedaron sincronizados con la realidad de `main` y `develop`.
- Se agregaron plantillas de issues en [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) y [`docs/templates/linear-issue-templates.md`](../templates/linear-issue-templates.md).

**Regla de oro:** revisar `origin/develop` y Linear antes de abrir tickets o ramas nuevas; la mayoría de las mejoras de octubre viven en `develop`, no en `main`.

---

## 6. Deuda técnica y riesgos actuales

### Resuelto desde el corte anterior (M1–M4)

- ~~RLS tasks (`ZER-42`), guards de `takeTask`/`markTaskDone`/`verifyTask` (`src/features/tasks/actions.ts`), validación/trim en `createTask` y `updateProfile`/`saveOnboardingStep2` (`ZER-55`), constante `isTasksBlockedTier` (`ZER-58`), exclusión de canceladas (`ZER-62`), asterisco `required` en `Input` (`ZER-53` Canceled).~~ (Ver `_bmad-output/implementation-artifacts/deferred-work.md`).

### Riesgos operativos activos (2026-11-24)

1. **Cola de release acumulada (`develop` → `main`):** 30 tickets en `Ready for Deploy` (+98 commits y +11 migraciones SQL) esperan release a `main`. Mientras `develop` y `main` divergen en esquema (p. ej. `skills.estado`, `donaciones`, `projects.archivado_en`, `tasks.categorias`), probar localmente contra una DB con el esquema de `main` produce falsos bugs (como ocurrió en `ZER-223`).
2. **PRs en espera desde `2026-11-05`:** `#166` (`ZER-202`) y `#167` (`ZER-225`) tienen CI verde y esperan revisión.
3. **QA DoD E2E pendiente en Backlog:** `ZER-86` (Story 5.9 — QA M5) y `ZER-105` (Story 7.8 — QA M7) siguen en `Backlog` aunque el código ya está en `main`.
4. **Tickets `In Progress` sin actividad reciente:** `ZER-192` (19/10) y `ZER-144` (17/10) no tienen PR ni branch remoto.
5. **Backlog operativo pendiente:** `ZER-72` (email real vía Resend SMTP, Backlog), `ZER-179` (bucket avatares, Backlog), `ZER-135` (verificar email antes del onboarding, Backlog).

---

## 7. Plan de acción inmediato

1. **Revisar y mergear PRs abiertos a `develop`:** `#166` (`ZER-202`) y `#167` (`ZER-225`).
2. **Preparar release `develop` → `main` (`v0.2.0`):** validar las 11 migraciones nuevas en `test`/staging, mergear `develop` → `main` y pasar los 30 tickets `Ready for Deploy` a `Done` en Linear.
3. **Cerrar QA formal de M5 y M7:** ejecutar `ZER-86` y `ZER-105` sobre la versión desplegada.
4. **Destrabar `In Progress`:** revisar estado con responsables de `ZER-192` (`fabrizioleali2205`) y `ZER-144` (`agustindxm`).

---

## 8. Comandos útiles al retomar

```bash
git fetch origin --prune
git log --oneline origin/main..origin/develop -20
gh pr list --state open
gh pr list --state merged --limit 15

pnpm install
pnpm test
pnpm typecheck
pnpm lint
```

---

## 9. Sprint / Corte actual

| Campo          | Valor                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Corte          | 2026-11-24                                                                                                               |
| Foco           | Reconciliación tracking/docs + revisión PRs `#166` / `#167` + release `develop` → `main` (30 tickets `Ready for Deploy`) |
| Siguiente hito | Merge `#166`/`#167` → release `develop` → `main` → cerrar 30–32 tickets a `Done`                                         |

---

## 10. Historial de este archivo

| Fecha      | Qué                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-17 | Alta inicial: recon post-idle (código, PRs, tracking stale, deferred, plan F0–F4)                                                                                                                                                                                                                 |
| 2026-09-18 | **Publicación** (`ZER-45` / `ZER-46`): reconciliación roadmap, `.pen`, `sprint-status.yaml` y stories M0–M4                                                                                                                                                                                       |
| 2026-09-20 | **QA M3/M4 y ticketización M7** (`ZER-63`, `ZER-64`, `ZER-98..105`)                                                                                                                                                                                                                               |
| 2026-09-21 | Notas de implementación `ZER-107` (TabBar 4 tabs + RLS non-tourist), `ZER-108`/`109` (`/solicitar` screening), `ZER-116` (`(modal)` project detail/requests) — todas ya cerradas `Done` en Linear y `main`                                                                                        |
| 2026-11-24 | **Reconciliación integral Linear ↔ GitHub ↔ Docs:** M0–M7 reflejados en `main` (`v0.1.0`), inventario de 30 `Ready for Deploy` en `origin/develop`, 2 `In Review` (`#166`, `#167`), 2 `In Progress` (`ZER-192`, `ZER-144`), plantillas de issues y diagramas visuales en `docs/roadmap/diagrams/` |
