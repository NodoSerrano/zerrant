import { describe, expect, it } from "vitest";
import { toApprovedProjectMembers } from "./detail-transform";

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
            nombre_visible: "Nóbel Dam",
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
            nombre_visible: "Pending User",
            avatar_url: null,
          },
        },
      ],
      "u1",
    );

    expect(members).toHaveLength(1);
    expect(members[0]?.name).toBe("Nóbel Dam");
    expect(members[0]?.rol).toBe("admin");
    expect(members[0]?.isCreator).toBe(true);
  });
});
