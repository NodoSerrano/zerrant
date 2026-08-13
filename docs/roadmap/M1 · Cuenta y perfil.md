---
tags: [roadmap, milestone]
status: done
depends-on: "[[M0 · Fundación]]"
---

# M1 · Cuenta y perfil

**Objetivo:** que alguien pueda crear cuenta, iniciar sesión y completar su perfil. Nace como `tier = tourist`.

**Entregable:** flujo de auth completo + onboarding que persiste el perfil.

## Pantallas (diseño)

`1.1 Login/Registro` · `1.2 Revisá tu email` · `1.3 Recuperar contraseña` · `1.4 Restablecer contraseña` · `1.5 Onboarding P1` · `1.6 Onboarding P2` · `2.6 Perfil` · `3.2 Editar perfil`.

## Datos

`profiles` (+ trigger de creación con `tier='tourist'`). Ver [[Modelo de datos]] y [[Seguridad RLS]].

## Alcance

- [ ] Auth email (magic link o password) + **Google OAuth** (`@supabase/ssr`).
- [ ] Callback route + middleware de sesión + protección de rutas.
- [ ] Trigger `auth.users` → `profiles` (`tier='tourist'`).
- [ ] Onboarding 2 pasos: foto, nombre, apellido, apodo, `nombre_visible`, fecha nac; luego bio, contacto (Telegram), sitio.
- [ ] Helper `displayName(profile)` según `nombre_visible` (unit test — buen candidato TDD).
- [ ] Recuperar/Restablecer contraseña.
- [ ] RLS de `profiles` (editar el propio; solo admin cambia `tier`).

## Done (DoD)

- Registro con email y con Google funcionan; se crea la fila `profiles`.
- Onboarding guarda datos y `displayName` respeta la preferencia.
- Un usuario nuevo queda como Tourist y ve la app en modo lectura.

**Siguiente:** [[M2 · Nodo — Tasks]] · [[M3 · Membresía y roles]]
