---
tags: [roadmap, milestone]
status: done
depends-on: []
---

# M0 · Fundación

**Objetivo:** dejar el proyecto listo para construir features: scaffold, design system en código, Supabase conectado y deploy funcionando.

**Entregable:** una app Next.js desplegada en Vercel que levanta, con tema (tokens) aplicado y conexión a Supabase verificada. Sin features aún.

## Alcance

- [ ] Scaffold Next.js (App Router) + TypeScript + Tailwind. Ver [[Stack técnico]].
- [ ] Tokens de Figma → tema Tailwind (`@theme`), claro/oscuro. Ver [[Design system]].
- [ ] Componentes base (Button, Input, Chip, Avatar, StatusBar/TabBar) como shell reutilizable.
- [ ] Supabase: proyecto, clientes `@supabase/ssr` (browser/server), middleware de sesión, envs.
- [ ] Migraciones con Supabase CLI (`supabase/migrations`) — pipeline vacío que corre.
- [ ] Deploy en Vercel + envs (`vercel env`).
- [ ] Setup de testing (Vitest + Testing Library).

## Fuera de alcance

Auth real, tablas de dominio (van desde [[M1 · Cuenta y perfil]]).

## Done (DoD)

- `pnpm dev` levanta; una página demo usa tokens en claro y oscuro.
- Deploy productivo accesible; healthcheck a Supabase OK.
- Un test de ejemplo corre en CI.

**Siguiente:** [[M1 · Cuenta y perfil]]
