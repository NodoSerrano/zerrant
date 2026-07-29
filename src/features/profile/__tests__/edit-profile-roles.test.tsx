import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesUpdate: vi.fn(),
  profilesUpdateEq: vi.fn(),
  profileRolesSelectEq: vi.fn(),
  profileRolesDeleteEq: vi.fn(),
  profileRolesDeleteIn: vi.fn(),
  profileRolesInsert: vi.fn(),
  rolesSelectIn: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "roles") {
        return {
          select: vi.fn(() => ({
            in: mocks.rolesSelectIn,
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => mocks.profileRolesSelectEq()),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: mocks.profileRolesDeleteIn,
            })),
          })),
          insert: mocks.profileRolesInsert,
        };
      }
      return {
        update: mocks.profilesUpdate.mockImplementation(() => ({
          eq: mocks.profilesUpdateEq,
        })),
      };
    }),
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateProfile } from "@/features/profile/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateProfile — roles", () => {
  const BASE_FIELDS = {
    nombre: "Juan",
    apellido: "Pérez",
    apodo: "juancito",
    nombre_visible: "nombre_apellido",
    fecha_nacimiento: "1990-01-15",
    bio: "Hello",
    contacto_telegram: "@juan",
    sitio_url: "https://example.com",
    disponibilidad: "full_time",
    visibilidad_tarifa: "publica",
    tarifa_hora: 50,
  };

  function setupAuth(userId = "test-user-id") {
    mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  }

  function setupProfileUpdateSuccess() {
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
  }

  function formWithRoles(roleIds: string[]): FormData {
    const fd = new FormData();
    fd.set("nombre", "Juan");
    fd.set("apellido", "Pérez");
    fd.set("apodo", "juancito");
    fd.set("nombre_visible", "nombre_apellido");
    fd.set("fecha_nacimiento", "1990-01-15");
    fd.set("bio", "Hello");
    fd.set("contacto_telegram", "@juan");
    fd.set("sitio_url", "https://example.com");
    fd.set("disponibilidad", "full_time");
    fd.set("visibilidad_tarifa", "publica");
    fd.set("tarifa_hora", "50");
    for (const roleId of roleIds) {
      fd.append("roles", roleId);
    }
    return fd;
  }

  it("inserts new roles and removes deselected unconfirmed ones", async () => {
    setupAuth();
    setupProfileUpdateSuccess();
    mocks.rolesSelectIn.mockResolvedValue({
      data: [{ id: "role-a" }, { id: "role-b" }],
      error: null,
    });
    mocks.profileRolesSelectEq.mockResolvedValue({
      data: [{ role_id: "role-a", confirmado: true }],
      error: null,
    });
    mocks.profileRolesDeleteIn.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesInsert.mockResolvedValue({ data: null, error: null });

    const fd = formWithRoles(["role-a", "role-b"]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(BASE_FIELDS);
    expect(mocks.profileRolesInsert).toHaveBeenCalledWith([
      { profile_id: "test-user-id", role_id: "role-b" },
    ]);
  });

  it("preserves confirmed roles that are still selected", async () => {
    setupAuth();
    setupProfileUpdateSuccess();
    mocks.rolesSelectIn.mockResolvedValue({
      data: [{ id: "role-a" }],
      error: null,
    });
    mocks.profileRolesSelectEq.mockResolvedValue({
      data: [{ role_id: "role-a", confirmado: true }],
      error: null,
    });

    const fd = formWithRoles(["role-a"]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profileRolesInsert).not.toHaveBeenCalled();
    expect(mocks.profileRolesSelectEq).not.toHaveBeenCalledWith("profile_roles");
  });

  it("deletes unconfirmed roles that were deselected", async () => {
    setupAuth();
    setupProfileUpdateSuccess();
    mocks.rolesSelectIn.mockResolvedValue({
      data: [{ id: "role-a" }, { id: "role-b" }],
      error: null,
    });
    mocks.profileRolesSelectEq.mockResolvedValue({
      data: [
        { role_id: "role-a", confirmado: false },
        { role_id: "role-b", confirmado: false },
        { role_id: "role-c", confirmado: false },
      ],
      error: null,
    });
    mocks.profileRolesDeleteIn.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesInsert.mockResolvedValue({ data: null, error: null });

    const fd = formWithRoles(["role-a", "role-b"]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profileRolesDeleteIn).toHaveBeenCalledWith("role_id", ["role-c"]);
  });

  it("validates submitted role IDs against roles catalog", async () => {
    setupAuth();
    setupProfileUpdateSuccess();
    mocks.rolesSelectIn.mockResolvedValue({
      data: [{ id: "role-a" }],
      error: null,
    });

    const fd = formWithRoles(["role-a", "role-inventada"]);

    const result = await updateProfile(null, fd);

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });

  it("updates profile even when no roles are submitted", async () => {
    setupAuth();
    setupProfileUpdateSuccess();
    mocks.profileRolesSelectEq.mockResolvedValue({
      data: [{ role_id: "role-a", confirmado: false }],
      error: null,
    });
    mocks.profileRolesDeleteIn.mockResolvedValue({ data: null, error: null });

    const fd = formWithRoles([]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(BASE_FIELDS);
    expect(mocks.profileRolesDeleteIn).toHaveBeenCalledWith("role_id", ["role-a"]);
    expect(mocks.profileRolesInsert).not.toHaveBeenCalled();
  });

  it("returns error when profile update fails before touching roles", async () => {
    setupAuth();
    mocks.profilesUpdateEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await updateProfile(null, new FormData());

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
    expect(mocks.profileRolesSelectEq).not.toHaveBeenCalled();
  });
});
