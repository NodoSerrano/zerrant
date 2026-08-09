import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  profileRolesUpdate: vi.fn(),
  profileRolesUpdateEq1: vi.fn(),
  profileRolesUpdateEq2: vi.fn(),
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
          update: mocks.profileRolesUpdate.mockImplementation(() => ({
            eq: mocks.profileRolesUpdateEq1.mockImplementation(() => ({
              eq: mocks.profileRolesUpdateEq2,
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

import { confirmProfileRole } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAuth(userId = "admin-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

const makeFormData = (profileId = "profile-001", roleId = "role-001") => {
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
    mocks.profileRolesUpdateEq2.mockResolvedValue({ error: null });

    try {
      await confirmProfileRole(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.profilesSelect).toHaveBeenCalledWith("is_platform_admin");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "admin-user-id");
    expect(mocks.profileRolesUpdate).toHaveBeenCalledWith({ confirmado: true });
    expect(mocks.profileRolesUpdateEq1).toHaveBeenCalledWith("profile_id", "profile-001");
    expect(mocks.profileRolesUpdateEq2).toHaveBeenCalledWith("role_id", "role-001");
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

  it("returns error when profile_roles update fails", async () => {
    setupAuth("admin-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { is_platform_admin: true },
    });
    mocks.profileRolesUpdateEq2.mockResolvedValue({
      error: { message: "DB error" },
    });

    const result = await confirmProfileRole(null, makeFormData());

    expect(result).toEqual({ error: "DB error" });
  });
});
