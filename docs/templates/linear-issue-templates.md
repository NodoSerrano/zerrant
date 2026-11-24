# Plantillas de Issues — Linear (`ZER-*`) & GitHub

> **SSOT del workflow:** Linear (`https://linear.app/zerrant`) es el tracker principal del equipo (`ZER-*`). Los Issue Forms de GitHub viven en [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) y siguen exactamente esta misma estructura.

---

## Contrato Linear ↔ GitHub

| Estado en Linear   | Significado en GitHub / Ambiente                                         | Quién / Cómo transiciona                                 |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `Backlog`          | Idea, epic o story todavía sin priorizar                                 | PM / equipo                                              |
| `Todo`             | Listo y priorizado para tomar                                            | Equipo                                                   |
| `In Progress`      | Branch activo (`<usuario>/zer-<n>-<slug>`) en desarrollo con TDD         | Dev al tomar el ticket                                   |
| `In Review`        | PR abierto **contra `develop`** con CI verde (`test · typecheck · lint`) | Dev al abrir PR (`<type>(<scope>): <resumen> (ZER-<n>)`) |
| `Ready for Deploy` | PR mergeado a `develop` (desplegado en ambiente `test`)                  | Reviewer / Dev al mergear a `develop`                    |
| `Done`             | Release `develop` → `main` mergeado (desplegado en ambiente `prod`)      | Al publicar release a `main`                             |

### Convenciones

- **Labels en Linear:** `Feature`, `Bug`, `Improvement`, `ux-debt`, `tech-debt`, `security`, `ops`, `qa`.
- **Ramas:** `<usuario>/zer-<n>-<slug-corto>` (saliendo desde `develop`).
- **Títulos de PR:** `<type>(<scope>): <resumen> (ZER-<n>)` (ej. `feat(projects): join reject motivo and Inicio notices (ZER-202)`).
- **Target de PRs:** los PRs de feature/bug apuntan a **`develop`**, no a `main` (salvo hotfixes críticos acordados).

---

## 1. Template Linear: Feature / Improvement

Usar en Linear (`Team Settings → Templates`) para tickets con etiqueta `Feature`, `Improvement` o `ux-debt`.

```markdown
Origen: QA del equipo (DD/MM) / PRD / Frame Pencil `<id>` (dejar lo que aplique).

## Qué pasa hoy / Contexto

Explicar brevemente el comportamiento actual o la necesidad de negocio.

## Alcance

- Cambio concreto 1.
- Cambio concreto 2.

## Fuera de alcance

- Lo que explícitamente NO entra en este ticket.

## Datos, migraciones y RLS

- ¿Requiere migración en `supabase/migrations/`? (Sí / No — recordar `pnpm db:check-grants`).
- ¿Cambia policies RLS o visibilidad Tourist vs Serrano vs Admin?

## Acceptance criteria

1. Comportamiento esperado 1 (cubierto por test Vitest / RTL).
2. Comportamiento esperado 2.

## Notas / Coordinación

- Relacionado con: ZER-XXX.
- Decisiones abiertas (`A definir`), si las hay.
```

---

## 2. Template Linear: Bug

Usar en Linear para tickets con etiqueta `Bug`. Título sugerido: `BUG: <resumen corto y concreto>`.

```markdown
Origen: QA del equipo (DD/MM) / Prod / Test (`develop`).

## Qué pasa

Descripción clara del error observado y cómo reproducirlo.

- **Ambiente:** `prod (main)` / `test (develop)` / `local`
- **Rol:** Tourist / Serrano / Admin de proyecto / Platform admin
- **Ruta:** `/...`

## Pista

Logs, error de PostgREST/Postgres, PR relacionado o verificación de schema (`develop` vs `main`, ej. migraciones no aplicadas en `.env.local`).

## Alcance

- Reproducir con test TDD que falle antes del fix.
- Corregir la causa raíz (sin dejar tech debt).

## Acceptance criteria

1. Caso reproducible pasa y queda cubierto por test automatizado.
2. Sin regresiones en `pnpm typecheck`, `pnpm lint` y `pnpm test`.
```

---

## 3. Template Linear: Security / Tech Debt / Ops

Usar en Linear para tickets con etiqueta `security`, `tech-debt` o `ops`.

```markdown
Origen: Auditoría / Code Review / `deferred-work.md` / Infra.

## Riesgo o deuda actual

Qué superficie está expuesta, qué regla de RLS/grants falta o qué fricción operativa genera.

- **Archivos / tablas involucradas:** `src/...`, `supabase/migrations/...`

## Solución propuesta

- Cambio técnico o migración necesaria.
- Si toca DB: validar grants para `authenticated` y políticas RLS por rol (`is_non_tourist()`, `is_platform_admin`, etc.).

## Criterio de verificación (DoD)

1. Test unitario / de integración o verificación reproducible en CI (`pnpm test`, `pnpm db:check-grants`).
2. Documentación actualizada si cambia el contrato (`docs/roadmap/Seguridad RLS.md`, `Modelo de datos.md` o `STATUS.md`).
```
