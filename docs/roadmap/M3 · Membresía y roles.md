---
tags: [roadmap, milestone]
status: in-progress
depends-on: "[[M1 · Cuenta y perfil]]"
---

# M3 · Membresía y roles

**Objetivo:** implementar el modelo de dos ejes — **Tier** y **Rol** — y el flujo Tourist → Serrano. Ver [[Glosario]].

**Entregable:** un Tourist solicita membresía; un admin la aprueba y asigna tier; los serranos autoasignan roles que el admin confirma.

## Pantallas (diseño)

`1.7 Solicitar membresía` · `1.8 Solicitud en revisión` · `1.9 ¡Solicitud enviada!` · `2.7 Perfil (Tourist)` · `6.1 Admin — Membresías` · `6.2 Admin — Roles a confirmar` · (roles en `3.2 Editar perfil`).

## Datos

`membership_requests`, `roles`, `profile_roles` (`confirmado`), `profiles.tier`, `is_platform_admin`. Ver [[Modelo de datos]] y [[Seguridad RLS]].

## Alcance

- [ ] Solicitud de membresía (mensaje opcional) + estados.
- [ ] Perfil de Tourist con CTA "Solicitar ser Serrano".
- [ ] Panel admin: cola de membresías (aprobar → asignar tier / rechazar).
- [ ] Roles: autoasignación + confirmación por admin; **TierBadge** y **RoleChip** en perfil.
- [ ] Primer admin por seed manual.
- [ ] RLS de todas estas tablas.

## Done (DoD)

- Un Tourist solicita, un admin aprueba y pasa a Standard.
- Un rol propuesto queda pendiente hasta que un admin lo confirma.

**Siguiente:** [[M4 · Plantel y directorio]]
