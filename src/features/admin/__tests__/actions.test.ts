import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  rpc: vi.fn(),
  membershipUpdate: vi.fn(),
  membershipUpdateEq: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
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
      if (table === "membership_requests") {
        return {
          update: mocks.membershipUpdate.mockImplementation(() => ({
            eq: mocks.membershipUpdateEq,
          })),
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

import { approveRequest, rejectRequest } from "../actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAuth(userId = "admin-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

const makeFormData = (requestId = "req-001") => {
  const fd = new FormData();
  fd.set("requestId", requestId);
  return fd;
};

describe("approveRequest", () => {
  it("delegates to RPC and redirects on success", async () => {
    setupAuth("admin-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });

    try {
      await approveRequest(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.rpc).toHaveBeenCalledWith("approve_membership_request", {
      p_request_id: "req-001",
    });
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await approveRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns error when user is not platform admin", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede aprobar solicitudes" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns error when RPC itself fails (client error)", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "DB error" });
    expect(mocks.rpc).toHaveBeenCalledWith("approve_membership_request", {
      p_request_id: "req-001",
    });
  });

  it("returns error when RPC succeeds but returns an application error", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({
      data: { error: "Solicitud no encontrada" },
      error: null,
    });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solicitud no encontrada" });
    expect(mocks.rpc).toHaveBeenCalledWith("approve_membership_request", {
      p_request_id: "req-001",
    });
  });
});

describe("rejectRequest", () => {
  it("allows platform admin to reject a pending request without changing tier", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq.mockResolvedValue({ error: null });

    try {
      await rejectRequest(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.membershipUpdate).toHaveBeenCalledWith({
      estado: "rechazada",
      revisado_por: "admin-user-id",
      actualizado_en: expect.any(String),
    });
    expect(mocks.membershipUpdateEq).toHaveBeenCalledWith("id", "req-001");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await rejectRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membershipUpdate).not.toHaveBeenCalled();
  });

  it("returns error when user is not platform admin", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await rejectRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede rechazar solicitudes" });
    expect(mocks.membershipUpdate).not.toHaveBeenCalled();
  });

  it("returns error when membership update fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq.mockResolvedValue({ error: { message: "Error al actualizar" } });

    const result = await rejectRequest(null, makeFormData());

    expect(result).toEqual({ error: "Error al actualizar" });
  });
});
