import { describe, expect, it } from "vitest";
import { displayName } from "./displayName";
import type { Profile } from "./types";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "test@nodo.org",
    nombre: "Juan",
    apellido: "Pérez",
    apodo: "juancito",
    nombre_visible: "nombre_apellido",
    avatar_url: null,
    tier: "tourist",
    is_platform_admin: false,
    fecha_nacimiento: null,
    bio: null,
    contacto_telegram: null,
    sitio_url: null,
    disponibilidad: null,
    tarifa_hora: null,
    visibilidad_tarifa: "privada",
    aprobado_en: null,
    onboarding_completado_en: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("displayName", () => {
  it('returns nombre + apellido when nombre_visible is "nombre_apellido"', () => {
    const p = makeProfile({ nombre_visible: "nombre_apellido" });
    expect(displayName(p)).toBe("Juan Pérez");
  });

  it('returns apellido + nombre when nombre_visible is "apellido_nombre"', () => {
    const p = makeProfile({ nombre_visible: "apellido_nombre" });
    expect(displayName(p)).toBe("Pérez Juan");
  });

  it('returns apodo when nombre_visible is "apodo"', () => {
    const p = makeProfile({ nombre_visible: "apodo" });
    expect(displayName(p)).toBe("juancito");
  });

  it("falls back to nombre + apellido when apodo is null", () => {
    const p = makeProfile({ nombre_visible: "apodo", apodo: null });
    expect(displayName(p)).toBe("Juan Pérez");
  });

  it("falls back to nombre only when apellido is null", () => {
    const p = makeProfile({
      nombre_visible: "nombre_apellido",
      apellido: null,
    });
    expect(displayName(p)).toBe("Juan");
  });

  it("falls back to apellido only when nombre is null", () => {
    const p = makeProfile({
      nombre_visible: "apellido_nombre",
      nombre: null,
    });
    expect(displayName(p)).toBe("Pérez");
  });

  it("handles both nombre and apellido null gracefully", () => {
    const p = makeProfile({
      nombre_visible: "nombre_apellido",
      nombre: null,
      apellido: null,
    });
    expect(displayName(p)).toBe("");
  });
});
