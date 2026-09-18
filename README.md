# Nodo Serrano — Backoffice

PWA mobile-first para gestionar la comunidad Nodo Serrano. Un serrano se define por dos ejes: **Tier** (aporte economico) y **Rol** (aporte comunitario).

## Estado

> **Reanudación / estado operativo:** [docs/roadmap/STATUS.md](docs/roadmap/STATUS.md) — fuente viva (código real vs docs, PRs, deuda técnica, plan F0–F4). La tabla de abajo está reconciliada con `main`; STATUS tiene el detalle y los residuales abiertos de cada milestone.

| Milestone                                                                                | Estado  |
| ---------------------------------------------------------------------------------------- | ------- |
| [M0 · Fundacion](docs/roadmap/M0%20·%20Fundación.md)                                     | ✅ Done |
| [M1 · Cuenta y perfil](docs/roadmap/M1%20·%20Cuenta%20y%20perfil.md)                     | ✅ Done |
| [M2 · Nodo — Tasks](docs/roadmap/M2%20·%20Nodo%20—%20Tasks.md)                           | ✅ Done |
| [M3 · Membresia y roles](docs/roadmap/M3%20·%20Membresía%20y%20roles.md)                 | ✅ Done |
| [M4 · Plantel y directorio](docs/roadmap/M4%20·%20Plantel%20y%20directorio.md)           | ✅ Done |
| [M5 · Proyectos](docs/roadmap/M5%20·%20Proyectos.md)                                     | ⬜ Todo |
| [M6 · Aportes y eventos](docs/roadmap/M6%20·%20Aportes%20y%20eventos.md)                 | ⬜ Todo |
| [M7 · Cumpleanos, PWA y pulido](docs/roadmap/M7%20·%20Cumpleaños,%20PWA%20y%20pulido.md) | ⬜ Todo |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · Vercel

## Arranque

```bash
pnpm install
cp .env.example .env.local   # completar con las credenciales de Supabase
pnpm dev
```

## Comandos

| Comando          | Que hace                         |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Servidor de desarrollo           |
| `pnpm build`     | Build de produccion              |
| `pnpm test`      | Tests (Vitest + Testing Library) |
| `pnpm lint`      | Lint (oxlint)                    |
| `pnpm format`    | Formateo (oxfmt)                 |
| `pnpm typecheck` | Chequeo de tipos                 |

## CI

Cada PR contra `main` corre el workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. `pnpm install --frozen-lockfile` (con cache de pnpm)
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`

Si falla cualquiera de esos pasos, el check de CI falla. Marcar el job como **required check** en la branch protection de `main` es opcional y lo decide quien administre el repo.

## Documentacion

Toda la documentacion del proyecto esta en `docs/roadmap/`. Se recomienda abrir la carpeta como vault de Obsidian para navegar los links `[[...]]`.

- [Roadmap](docs/roadmap/Roadmap.md) — milestones y dependencias
- [Glosario](docs/roadmap/Glosario.md) — Tier, Rol, Serrano, Tourist, Aporte
- [Stack tecnico](docs/roadmap/Stack%20técnico.md) — decisiones de arquitectura
- [Modelo de datos](docs/roadmap/Modelo%20de%20datos.md) — tablas y relaciones
- [Seguridad RLS](docs/roadmap/Seguridad%20RLS.md) — reglas de acceso en Postgres
- [Design system](docs/roadmap/Design%20system.md) — tokens y componentes
- [Backlog](docs/roadmap/Backlog.md) — features parkeadas

## Estructura

```
src/
├── app/          # App Router (layout, paginas)
├── components/   # Componentes compartidos (ui/)
├── features/     # Features por dominio
│   ├── auth/     ├── profile/    ├── tasks/
│   ├── memberships/              ├── roster/
│   ├── projects/ ├── contributions/ ├── events/
└── lib/          # Supabase client, tipos compartidos
```
