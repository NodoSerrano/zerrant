import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  profileRolesUpdate: vi.fn(),
  chain: {
    eq: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: mocks.profilesSelect.mockImplementation(() => ({
            eq: mocks.profilesSelectEq.mockImplementation(() => ({
              single: mocks.profilesSelectSingle,
            })),
          })),
        };
      }
      if (table === "profile_roles") {
        return {
          update: mocks.profileRolesUpdate.mockImplementation(() => mocks.chain),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { confirmProfileRole } from "./actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

beforeEach(() => {
  vi.clearAllMocks();
  // Chainable builder: .eq().eq().eq().select()
  mocks.chain.eq.mockReturnValue(mocks.chain);
  mocks.chain.select.mockResolvedValue({ data: [{ id: "row-1" }], error: null });
});

function setupAuth(userId = "admin-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

const PROFILE_UUID = "11111111-1111-4111-8111-111111111111";
const ROLE_UUID = "22222222-2222-4222-8222-222222222222";

const makeFormData = (profileId = PROFILE_UUID, roleId = ROLE_UUID) => {
  const fd = new FormData();
  fd.set("profileId", profileId);
  fd.set("roleId", roleId);
  return fd;
};

describe("confirmProfileRole", () => {
  it("confirms a profile role and redirects on success", async () => {
    setupAuth("admin-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });

    await expect(confirmProfileRole(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.profilesSelect).toHaveBeenCalledWith("is_platform_admin");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "admin-user-id");
    expect(mocks.profileRolesUpdate).toHaveBeenCalledWith({ confirmado: true });
    expect(mocks.chain.eq).toHaveBeenCalledWith("profile_id", PROFILE_UUID);
    expect(mocks.chain.eq).toHaveBeenCalledWith("role_id", ROLE_UUID);
    expect(mocks.chain.eq).toHaveBeenCalledWith("confirmado", false);
    expect(mocks.chain.select).toHaveBeenCalledWith("id");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/roles");
    expect(redirect).toHaveBeenCalledWith("/admin/roles");
  });

  it("returns error when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await confirmProfileRole(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.profilesSelect).not.toHaveBeenCalled();
  });

  it("blocks non-admin users from confirming roles", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: false },
    });

    const result = await confirmProfileRole(null, makeFormData());

    expect(result).toEqual({
      error: "Solo un admin puede confirmar roles",
    });
    expect(mocks.profileRolesUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed profileId without calling update", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });

    const result = await confirmProfileRole(null, makeFormData("not-a-uuid", ROLE_UUID));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.profileRolesUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed roleId without calling update", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });

    const result = await confirmProfileRole(null, makeFormData(PROFILE_UUID, "bad"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.profileRolesUpdate).not.toHaveBeenCalled();
  });

  it("returns generic error when update fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.chain.select.mockResolvedValue({
      data: null,
      error: { message: "DB error secret detail" },
    });

    const result = await confirmProfileRole(null, makeFormData());

    expect(result).toEqual({ error: "Error al confirmar el rol" });
  });

  it("returns rejection when zero rows match (already confirmed or missing)", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.chain.select.mockResolvedValue({ data: [], error: null });

    const result = await confirmProfileRole(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos confirmar este rol." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("only sends confirmado in the update payload", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });

    await expect(confirmProfileRole(null, makeFormData())).rejects.toThrow("NEXT_REDIRECT");

    const updateCall = mocks.profileRolesUpdate.mock.calls[0][0];
    expect(updateCall).toEqual({ confirmado: true });
    expect(Object.keys(updateCall)).toHaveLength(1);
  });
});
