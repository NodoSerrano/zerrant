import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesUpdate: vi.fn(),
  profilesUpdateEq: vi.fn(),
  profileRolesDelete: vi.fn(),
  profileRolesDeleteEq: vi.fn(),
  profileRolesInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          update: mocks.profilesUpdate.mockImplementation(() => ({
            eq: mocks.profilesUpdateEq,
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          delete: mocks.profileRolesDelete.mockImplementation(() => ({
            eq: mocks.profileRolesDeleteEq,
          })),
          insert: mocks.profileRolesInsert,
        };
      }
      return {};
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

  function setupSuccess() {
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesDeleteEq.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesInsert.mockResolvedValue({ data: null, error: null });
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

  it("inserts selected roles when form includes roles[]", async () => {
    setupAuth();
    setupSuccess();

    const fd = formWithRoles(["role-a", "role-b"]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profileRolesDelete).toHaveBeenCalled();
    expect(mocks.profileRolesDeleteEq).toHaveBeenCalledWith("profile_id", "test-user-id");
    expect(mocks.profileRolesInsert).toHaveBeenCalledWith([
      { profile_id: "test-user-id", role_id: "role-a" },
      { profile_id: "test-user-id", role_id: "role-b" },
    ]);
  });

  it("deletes all existing roles when form sends no roles[]", async () => {
    setupAuth();
    setupSuccess();

    const fd = formWithRoles([]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profileRolesDelete).toHaveBeenCalled();
    expect(mocks.profileRolesDeleteEq).toHaveBeenCalledWith("profile_id", "test-user-id");
    expect(mocks.profileRolesInsert).not.toHaveBeenCalled();
  });

  it("returns error when role insert fails", async () => {
    setupAuth();
    mocks.profilesUpdateEq.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesDeleteEq.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesInsert.mockResolvedValue({
      data: null,
      error: { message: "RLS reject" },
    });

    const fd = formWithRoles(["role-a"]);

    const result = await updateProfile(null, fd);

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
  });

  it("returns error when role delete fails", async () => {
    setupAuth();
    mocks.profileRolesDeleteEq.mockResolvedValue({
      data: null,
      error: { message: "RLS reject" },
    });

    const fd = formWithRoles(["role-a"]);

    const result = await updateProfile(null, fd);

    expect(result).toEqual({ error: "No pudimos guardar tus datos. Probá de nuevo." });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
  });

  it("still updates profile even when no roles[] are submitted", async () => {
    setupAuth();
    setupSuccess();
    // Don't call setupSuccess for deletes - no roles means no delete
    // Actually we should still delete existing when roles is empty
    mocks.profileRolesDeleteEq.mockResolvedValue({ data: null, error: null });
    mocks.profileRolesInsert.mockResolvedValue({ data: null, error: null });

    const fd = formWithRoles([]);

    try {
      await updateProfile(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.profilesUpdate).toHaveBeenCalledWith(BASE_FIELDS);
  });
});
