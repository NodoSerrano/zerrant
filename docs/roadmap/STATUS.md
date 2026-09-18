# STATUS — Nodo Serrano (zerrant)

> Documento operativo de reanudación.  
> **No reemplaza** el PRD ni las stories BMad: resume dónde estamos, qué miente el tracking, y qué hacer después.  
> Actualizar este archivo cuando cambie el estado real (merges, cierres Linear, nuevos milestones).

| Campo                 | Valor                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Corte                 | 2026-09-18                                                                     |
| Repo                  | `NodoSerrano/zerrant`                                                          |
| Branch base           | `main` @ `1a6a14f` (merge PR #25, 2026-08-27)                                  |
| Working tree al corte | limpio                                                                         |
| Idle en `main`        | superado — cola de PRs vaciada el 2026-09-18                                   |
| Linear (UI fidelity)  | https://linear.app/zerrant/project/nodo-serrano-ui-fidelity-m0-m2-38ca59210685 |
| Diseño SSOT           | `design/nodo-serrano.pen`                                                      |
| Stories BMad          | `_bmad-output/implementation-artifacts/`                                       |
| Sprint map (stale)    | `_bmad-output/implementation-artifacts/sprint-status.yaml`                     |
| Deuda diferida        | `_bmad-output/implementation-artifacts/deferred-work.md`                       |

### Convención de status en Pencil (nombres de frame)

En `design/nodo-serrano.pen`, **solo pantallas** (no componentes `reusable`) llevan sufijo en el `name`:

| Sufijo       | Significado                     |
| ------------ | ------------------------------- |
| `(DONE)`     | Implementada y usable en `main` |
| `(PROGRESS)` | En vuelo (PR abierto o parcial) |
| `(TODO)`     | Aún no implementada             |

Ejemplo: `1.9 · ¡Solicitud enviada! (DONE)`.

- El **node id** (`D1hKT`, `P77en`, …) **no cambia** — las stories y el inventory siguen anclando por id.
- Al mergear un PR que cierra una pantalla: renombrar `(PROGRESS)` → `(DONE)` en el mismo PR de docs/design si hace falta.
- No poner sufijos en Avatar, TabBar, TaskCard, etc.

Conteo al corte 2026-09-18: **DONE 23** · **PROGRESS 0** · **TODO 15** (38 pantallas).

---

## 1. En una frase

**M0–M4 están en `main`** y la cola de PRs quedó en cero. Los docs de roadmap (`README.md`, `PROGRESS.md`, `Roadmap.md`, frontmatter `M*.md`) ya reflejan eso — se reconciliaron en ZER-45. Lo que **sigue mintiendo** es `sprint-status.yaml` y muchos story `Status:` de BMad (ver §5.1 / §5.2).

---

## 2. Qué es

PWA mobile-first, backoffice de la comunidad Nodo Serrano. Un serrano se define por **Tier** (aporte económico) y **Rol** (aporte comunitario).

| Capa    | Elección                                                              |
| ------- | --------------------------------------------------------------------- |
| App     | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4          |
| Backend | Supabase (Auth, Postgres, RLS, Storage)                               |
| Deploy  | Vercel                                                                |
| Tests   | Vitest + Testing Library (~62 archivos de test en `src/`)             |
| Proceso | BMad Method + Linear (`ZER-*`) · TDD obligatorio · fidelity vs Pencil |

Docs canónicos del producto: esta carpeta (`docs/roadmap/`), glosario, modelo de datos, RLS, stack, design system, backlog.

---

## 3. Estado real por milestone (código en `main`, no docs)

Leyenda: **Done** = feature usable en `main` · **Casi** = falta 1–2 piezas o PRs · **Parcial** = rutas/core OK, fidelity/tracking abiertos · **No** = sin dominio en código.

| Milestone                      | Docs (README/PROGRESS) | Realidad en `main` | Notas                                                                                                                                                               |
| ------------------------------ | ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 Fundación**               | Done                   | **Done**           | Scaffold, tokens, Supabase, deploy                                                                                                                                  |
| **M1 Cuenta y perfil**         | Done                   | **Done**           | Auth, onboarding step1/2, profile edit, recovery/reset/check-email en rutas. Residual: reconciliar fidelity stories en Linear                                       |
| **M2 Nodo — Tasks**            | Done                   | **Done (feature)** | Hub, create, detail, empty, cancelar/editar. Deuda RLS/actions (ver §6)                                                                                             |
| **M3 Membresía y roles**       | Done                   | **Done**           | Solicitud, admin membresías, admin roles, post-solicitud 1.8 y confirmación 1.9 (PR #26 merged). **Residual: el QA E2E en staging nunca se corrió** — ver §7 Fase 1 |
| **M4 Plantel y directorio**    | Done                   | **Done**           | Listado+filtros, detalle miembro y editar habilidades (PR #25 merged) en `main`. **Residual: `3.4 Mis aportes` quedó fuera** — PR #27 cerrado, diferido a M6        |
| **M5 Proyectos**               | Todo                   | **No**             | Sin feature/ruta                                                                                                                                                    |
| **M6 Aportes y eventos**       | Todo                   | **No**             | Sin tabla `aportes`. El chrome “Mis aportes” (PR #27) se cerró y entra acá                                                                                          |
| **M7 Cumpleaños, PWA, pulido** | Todo                   | **No**             | —                                                                                                                                                                   |
| **Backlog**                    | Parked                 | Parked             | Puntos Serrano, push, chat, facturación, pagos on-chain — ver `Backlog.md`                                                                                          |

Al corte anterior (2026-09-17) `Roadmap.md` marcaba **todos** los milestones en 🔲 todo. Corregido en ZER-45: README, PROGRESS, Roadmap y el frontmatter de `M*.md` dicen lo mismo que esta tabla.

### 3.1 Rutas en `main` (sí existen)

- Auth: login, signup, check-email, recovery, reset-password, callback
- Onboarding: `/onboarding/step1`, `/onboarding/step2`
- Profile: `/profile`, `/profile/edit`, `/profile/habilidades` (+ pantalla post-solicitud tourist)
- Tasks: `/nodo/tasks`, `/nodo/tasks/new`, `/nodo/tasks/[id]`
- Membresía: `/solicitar`, `/solicitar/enviado`, `/admin/membresias`, `/admin/roles`
- Plantel: `/plantel`, `/plantel/[id]`

### 3.2 Rutas NO en `main`

| Ruta               | PR                                                    | Issue  | Estado                                                                                      |
| ------------------ | ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `/profile/aportes` | [#27](https://github.com/NodoSerrano/zerrant/pull/27) | ZER-35 | **PR cerrado** el 2026-09-18 — el chrome se difiere a M6, junto con la tabla `aportes` real |

`/solicitar/enviado` (#26) y `/profile/habilidades` (#25) ya están en `main`.

### 3.3 Dominios en `src/features`

| Presente                                                              | Ausente / vacío                             |
| --------------------------------------------------------------------- | ------------------------------------------- |
| `auth`, `profile`, `tasks`, `membership`, `admin`, `roles`, `plantel` | `projects`, aportes/contributions, `events` |

Migraciones en repo hasta ~`20260821…` (grants DML, fix RLS recursion profiles, skills, membership RPCs, etc.).

---

## 4. Cola de PRs — **vacía** al corte

Los tres PRs que colgaban al corte anterior se resolvieron:

| PR                                                    | Issue  | Título                                 | Desenlace                             |
| ----------------------------------------------------- | ------ | -------------------------------------- | ------------------------------------- |
| [#25](https://github.com/NodoSerrano/zerrant/pull/25) | ZER-34 | M4.3 editar habilidades                | **MERGED** 2026-08-27                 |
| [#26](https://github.com/NodoSerrano/zerrant/pull/26) | ZER-26 | M3.3 confirmación `/solicitar/enviado` | **MERGED** 2026-08-29                 |
| [#27](https://github.com/NodoSerrano/zerrant/pull/27) | ZER-35 | M4.4 mis aportes chrome                | **CLOSED** 2026-09-18 — diferido a M6 |

Re-chequear con:

```bash
gh pr list --state open
gh pr list --state merged --limit 15
```

---

## 5. Tracking podrido (hacer antes de spamear tickets nuevos)

### 5.1 `sprint-status.yaml`

- `last_updated` ~ 2026-08-07 (y claves duplicadas confusas).
- Ejemplos de desfase vs `main`:
  - `4-3-nodo-tasks-hub` aparece backlog → **mergeado** (PR #9 / ZER-20)
  - `4-4-task-detail` review → **mergeado** (PR #13 / ZER-22)
  - `4-5-create-task` inconsistente story vs yaml → **mergeado** (PR #8 / ZER-21)
  - Faltan mappings Linear de varias stories M3 membresía / M4 plantel (más allá de ZER-32)

### 5.2 Story files BMad

Muchos siguen `Status: review` o `ready-for-dev` con código ya en `main` (tokens 1.x, onboarding 3.2, task detail 4.4, plantel 4.1, post-solicitud 3.4, etc.).

### 5.3 PROGRESS / README / Roadmap — ✅ **resuelto** (ZER-45)

| Archivo                       | Estado                                                  |
| ----------------------------- | ------------------------------------------------------- |
| `PROGRESS.md` / `README.md`   | M0–M4 en ✅ Done, con puntero a este STATUS             |
| `Roadmap.md`                  | Tabla alineada; conteo de pantallas corregido a 38      |
| Milestone frontmatter `M*.md` | `status: done` en M0–M4, `todo` en M5–M7                |
| `design/nodo-serrano.pen`     | Sufijos `(DONE)`/`(TODO)` publicados; 0 en `(PROGRESS)` |

**Sigue abierto:** §5.1 (`sprint-status.yaml`) y §5.2 (story `Status:`) — quedaron **fuera** del alcance de ZER-45 y son el próximo lote de ops.

### 5.4 Linear

Fuente de issues: proyecto UI Fidelity M0–M2 + IDs `ZER-*` en stories y PRs.  
Al corte **no había `LINEAR_API_KEY` local** en el entorno del agente: el board hay que reconciliarlo a mano o con token.

**Regla de oro:** no crear epics/features nuevas sin una pasada _Linear ↔ `main` ↔ sprint-status_. Riesgo alto de duplicar trabajo del equipo.

---

## 6. Deuda técnica / riesgos

Fuente: `_bmad-output/implementation-artifacts/deferred-work.md` (ampliar tickets desde ahí).

### P0 — Seguridad / correctness

1. **RLS tasks:** quien toma una tarea puede escribir `estado` (y a veces contenido) vía PostgREST y auto-verificarse. La UI está tapada; el agujero de fondo sigue.
2. **`takeTask` / `markTaskDone` / `verifyTask`:** pueden reportar éxito sin actualizar filas (carreras al “Tomar”). Parte mitigada en ZER-22; auditar las tres.
3. **`createTask`:** sin validación runtime seria; título `""`; errores crudos de DB; descripción `""` vs `null`.

### P1 — Producto / UX / infra

4. Layout global `p-5` vs padding Pencil; TabBar en pantallas “modales” (create/detail task).
5. TabBar con `<button onClick>` → sin JS no se navega.
6. Gate de onboarding: doble query de perfil + costo en prefetch de `<Link>`.
7. Grants: falta `alter default privileges` / chequeo CI para tablas nuevas (`42501`).
8. `pnpm-workspace.yaml` stub `allowBuilds` ensucia installs y empuja a `--no-verify`.
9. Hub de tasks incluye canceladas en “Todas” (decisión de producto).

---

## 7. Plan de reanudación (para el equipo Nodo)

### Fase 0 — Higiene (bloquear features nuevas hasta acá)

1. ~~Merge PR #25 y #26~~ — **hecho** (merged 2026-08-27 / 2026-08-29).
2. ~~Decidir PR #27~~ — **hecho**: cerrado, diferido a M6.
3. Reconciliar Linear: cerrar/`Done` todo lo que ya está en `main`. ⏳
4. Actualizar docs de roadmap — **hecho en ZER-45** (`README.md`, `PROGRESS.md`, `Roadmap.md`, frontmatter `M*.md`, `.pen`). **Falta** `sprint-status.yaml` y los story `Status:`. ⏳
5. Bajar `deferred-work.md` a tickets etiquetados (`security`, `tech-debt`, `ux-debt`). ⏳

**DoD Fase 0:** un dev nuevo lee este STATUS + Linear y no se contradicen.

### Fase 1 — Cerrar M3 de verdad

- ~~Aterrizar 1.9 (ZER-26 / PR #26)~~ — **merged**.
- ~~Marcar M3 Done en PROGRESS~~ — **hecho en ZER-45**.
- Cerrar gaps de profile shells / edit fidelity si Linear los tiene abiertos (área ZER-15/16/17). ⏳
- ⚠️ **RESIDUAL ABIERTO — QA E2E en staging**: tourist → `/solicitar` → `/solicitar/enviado` → admin aprueba tier → roles auto + confirm admin. Todo el alcance de M3 está en `main` y los docs lo marcan Done, pero **este DoD nunca se verificó end-to-end**. Correrlo antes de apoyarse en M3 para M5+.

### Fase 2 — Cerrar M4

- ~~Merge habilidades (ZER-34)~~ — **merged** (PR #25).
- ~~Decidir Mis aportes chrome (ZER-35)~~ — **cerrado, diferido a M6**.
- ⚠️ **RESIDUAL ABIERTO — `3.4 Mis aportes`**: está en el alcance escrito de [[M4 · Plantel y directorio]] pero **no se implementó**. M4 figura Done en los docs con esa pieza afuera; la pantalla vive en el epic M6 (Fase 4).
- Bugs/fidelity sobre listado + detalle ya en `main`. ⏳
- DoD M4: solo serranos, tarifa privada según reglas, skills OK — **sin QA formal**. ⏳

### Fase 3 — Hardening tasks (corto, en paralelo o justo antes de más comunidad)

- Tickets SEC: split policies creador vs tomador.
- Validación `createTask` al estilo `profile/actions`.
- Fail si UPDATE 0 rows en take/mark/verify.

### Fase 4 — Producto nuevo (recién acá “sacar tickets nuevos” de feature)

- **Epic M5** Proyectos (tabla + RLS + hub Nodo + CRUD + join/aprobación).
- **Epic M6** Aportes reales (alimenta 3.4 y detalle miembro) + Agenda/RSVP.
- **Epic M7** Cumples, PWA, offline, dark polish.

---

## 8. Backlog de tickets sugeridos (plantilla)

Usar como checklist al crear en Linear. **No duplicar** si el issue ya existe — linkear.

### Ops / tracking

- [ ] Reconciliar `sprint-status.yaml` + story Status vs `main` ← **próximo lote**
- [x] Actualizar `PROGRESS.md` / `README.md` / `Roadmap.md` milestones — ZER-45
- [ ] Inventario Linear open vs PRs merged (matriz ZER-*)
- [ ] Mantener este `STATUS.md` en cada cierre de sprint

### Merge queue — cerrada

- [x] ZER-34 / PR #25 — habilidades (merged)
- [x] ZER-26 / PR #26 — confirmación solicitud (merged)
- [x] ZER-35 / PR #27 — mis aportes chrome (cerrado → M6)

### Security / correctness

- [ ] SEC: split RLS policies tasks (creador contenido vs tomador transiciones de estado)
- [ ] BUG: take/mark/verify fallan si 0 rows updated
- [ ] BUG: validate + trim `createTask`; no leak mensajes DB
- [ ] INFRA: default privileges `authenticated` + check en CI
- [ ] INFRA: resolver `pnpm approve-builds` / `allowBuilds`

### Fidelity / UX residual

- [ ] UX: route group modal sin TabBar para create/edit task
- [ ] UX: padding layout vs Pencil
- [ ] DS: asterisco `required` en Input vs frames Pencil
- [ ] PERF: cachear profile gate por request
- [ ] A11y: TabBar con links reales (progressive enhancement)

### M3 remaining (docs ya en Done — esto es lo que quedó debiendo)

- [ ] Gaps onboarding step2 / recovery-reset fidelity
- [ ] ⚠️ **QA DoD M3 end-to-end en staging** — nunca se corrió
- [x] Cerrar epic M3 en PROGRESS — ZER-45
- [ ] Cerrar epic M3 en el board de Linear

### M4 remaining (docs ya en Done — esto es lo que quedó debiendo)

- [ ] ⚠️ **`3.4 Mis aportes`** — fuera de M4, va con el epic M6
- [ ] QA plantel (solo serranos, tarifa privada)
- [x] Cerrar epic M4 en PROGRESS — ZER-45
- [ ] Decisión producto: canceladas en hub “Todas”

### M5+ (nuevos, post Fase 0–2)

- [ ] Epic M5 — Proyectos
- [ ] Epic M6 — Aportes
- [ ] Epic M6 — Eventos + RSVP
- [ ] Epic M7 — PWA / cumples / pulido

---

## 9. Riesgos si se retoma mal

1. Duplicar features porque el board y `sprint-status.yaml` todavía no reflejan los merges de agosto.
2. Leer M3/M4 como ✅ Done y olvidar los dos residuales: el **QA E2E de M3** y **`3.4 Mis aportes`** (ver §7 Fase 1 y Fase 2).
3. “Validar con la comunidad” tasks con RLS mentiroso.
4. ~~Onboard de devs con `Roadmap.md` en todo~~ — resuelto en ZER-45.

---

## 10. Comandos útiles al retomar

```bash
git fetch origin && git checkout main && git pull
git log --oneline -20
gh pr list --state open
gh pr list --state merged --limit 15

pnpm install
pnpm test
pnpm typecheck
pnpm lint
```

Stories y deuda:

- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/*.md`
- `docs/roadmap/PROGRESS.md` (actualizar cuando este STATUS diga que un M cerró)

---

## 11. Cómo evolucionar este documento

1. Tras cada merge batch a `main`: actualizar §3, §4 y la tabla de milestones.
2. Tras reconciliar Linear: tachar ítems de §8 y linkear IDs `ZER-*`.
3. Cuando M3/M4 cierren de verdad: alinear `PROGRESS.md` + README en el mismo PR de docs.
4. Cuando se abra M5+: no borrar historia; agregar sección “Sprint actual” arriba del todo.

### Sprint actual (editar acá)

| Campo                   | Valor                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Foco                    | Fase 0 — docs de roadmap reconciliadas (ZER-45); falta `sprint-status.yaml` + story `Status:` + board Linear |
| Owner                   | Juan Peñalba                                                                                                 |
| Bloquea features nuevas | Sí, hasta DoD Fase 0                                                                                         |
| Próxima revisión        | Al cerrar el lote de `sprint-status.yaml`                                                                    |

---

## 12. Historial de este archivo

| Fecha      | Qué                                                                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-17 | Alta inicial: recon post-idle (código, PRs, tracking stale, deferred, plan F0–F4)                                                                                                                                                         |
| 2026-09-18 | **Publicación** (ZER-45): archivo trackeado + README/PROGRESS/Roadmap/frontmatter/`.pen` reconciliados. Cola de PRs a cero (#25 y #26 merged, #27 cerrado → M6). M0–M4 en Done, con 2 residuales abiertos (QA E2E M3 · `3.4 Mis aportes`) |
