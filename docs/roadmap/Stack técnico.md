---
tags: [roadmap, referencia, stack]
---

# 🧱 Stack técnico

Decisiones de arquitectura. Contexto en [[2026-07-20-nodo-serrano-backoffice-design|PRD §7]].

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Mobile-first, PWA.
- **UI:** tokens de Figma/Pencil como tema de Tailwind → ver [[Design system]].
- **Backend/datos:** **Supabase** — Auth (email + Google), Postgres, [[Seguridad RLS|RLS]], Storage (avatares).
- **Auth en Next:** `@supabase/ssr` (createServerClient/createBrowserClient + proxy/middleware de sesión).
- **PWA:** manifest + service worker vía **Serwist** (`@serwist/next` / `serwist`).
- **Hosting:** **VPS self-hosted con Docker Compose** (`.github/workflows/deploy.yml`: `develop` → `test`, `main` → `prod`).
- **Testing & calidad:** Vitest + Testing Library (unit/componente); `oxlint` + `oxfmt`; Supabase local (CLI) para migraciones y verificación de grants (`pnpm db:check-grants`).

## Decisiones cerradas

- Gestor de paquetes: **pnpm 10** y Node **22** en CI (`.github/workflows/ci.yml`).
- Migraciones: **Supabase CLI** (`supabase/migrations`) versionadas en el repo (40 en `main`, 51 en `develop`).
- Estructura de carpetas por **feature** en `src/features/` (no por capa técnica).
- Deploy automatizado en VPS por push a `develop` (`test`) y `main` (`prod`).
