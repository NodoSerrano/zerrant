import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  rpc: vi.fn(),
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

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

const makeFormData = (requestId = VALID_UUID) => {
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
      p_request_id: VALID_UUID,
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

    expect(result).toEqual({ error: "Error al aprobar la solicitud" });
    expect(mocks.rpc).toHaveBeenCalledWith("approve_membership_request", {
      p_request_id: VALID_UUID,
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
      p_request_id: VALID_UUID,
    });
  });

  it("rejects a malformed requestId without calling the RPC", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });

    const result = await approveRequest(null, makeFormData("req-001"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("rejectRequest", () => {
  it("delegates to RPC and redirects on success", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });

    try {
      await rejectRequest(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.rpc).toHaveBeenCalledWith("reject_membership_request", {
      p_request_id: VALID_UUID,
    });
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await rejectRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns error when user is not platform admin", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await rejectRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede rechazar solicitudes" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns error when RPC itself fails (client error)", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const result = await rejectRequest(null, makeFormData());

    expect(result).toEqual({ error: "Error al rechazar la solicitud" });
    expect(mocks.rpc).toHaveBeenCalledWith("reject_membership_request", {
      p_request_id: VALID_UUID,
    });
  });

  it("returns error when RPC succeeds but returns an application error", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({
      data: { error: "La solicitud ya fue procesada" },
      error: null,
    });

    const result = await rejectRequest(null, makeFormData());

    expect(result).toEqual({ error: "La solicitud ya fue procesada" });
    expect(mocks.rpc).toHaveBeenCalledWith("reject_membership_request", {
      p_request_id: VALID_UUID,
    });
  });

  it("rejects a malformed requestId without calling the RPC", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });

    const result = await rejectRequest(null, makeFormData("req-001"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
