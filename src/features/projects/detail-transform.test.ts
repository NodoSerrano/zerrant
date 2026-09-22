import { describe, expect, it } from "vitest";
import { memberDisplayName, toApprovedProjectMembers } from "./detail-transform";

describe("memberDisplayName", () => {
  it('formats nombre_apellido enum as "{nombre} {apellido}"', () => {
    expect(
      memberDisplayName({
        nombre: "Juan",
        apellido: "Peñalba",
        apodo: "juancito",
        nombre_visible: "nombre_apellido",
        avatar_url: null,
      }),
    ).toBe("Juan Peñalba");
  });

  it('formats apellido_nombre enum as "{apellido} {nombre}"', () => {
    expect(
      memberDisplayName({
        nombre: "Juan",
        apellido: "Peñalba",
        apodo: null,
        nombre_visible: "apellido_nombre",
        avatar_url: null,
      }),
    ).toBe("Peñalba Juan");
  });

  it("formats apodo enum as the nickname when present", () => {
    expect(
      memberDisplayName({
        nombre: "Juan",
        apellido: "Peñalba",
        apodo: "juancito",
        nombre_visible: "apodo",
        avatar_url: null,
      }),
    ).toBe("juancito");
  });

  it("never returns raw enum tokens when name fields exist", () => {
    for (const token of ["nombre_apellido", "apellido_nombre", "apodo"] as const) {
      const name = memberDisplayName({
        nombre: "Nobel",
        apellido: "Dam",
        apodo: "nob",
        nombre_visible: token,
        avatar_url: null,
      });
      expect(name).not.toBe(token);
    }
  });

  it("falls back to ? when profile is missing", () => {
    expect(memberDisplayName(null)).toBe("?");
    expect(memberDisplayName(undefined)).toBe("?");
  });

  it("falls back to ? when name fields are empty", () => {
    expect(
      memberDisplayName({
        nombre: null,
        apellido: null,
        apodo: null,
        nombre_visible: "nombre_apellido",
        avatar_url: null,
      }),
    ).toBe("?");
  });
});

describe("toApprovedProjectMembers", () => {
  it("excludes pendiente rows from the member list and count source", () => {
    const members = toApprovedProjectMembers(
      [
        {
          profile_id: "u1",
          estado: "aprobado",
          rol: "admin",
          profiles: {
            id: "u1",
            nombre: "Nobel",
            apellido: "Dam",
            apodo: null,
            nombre_visible: "nombre_apellido",
            avatar_url: null,
          },
        },
        {
          profile_id: "u2",
          estado: "pendiente",
          rol: "miembro",
          profiles: {
            id: "u2",
            nombre: "Pending",
            apellido: "User",
            apodo: null,
            nombre_visible: "nombre_apellido",
            avatar_url: null,
          },
        },
      ],
      "u1",
    );

    expect(members).toHaveLength(1);
    expect(members[0]?.name).toBe("Nobel Dam");
    expect(members[0]?.rol).toBe("admin");
    expect(members[0]?.isCreator).toBe(true);
  });
});
