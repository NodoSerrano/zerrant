import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  membershipUpdate: vi.fn(),
  membershipUpdateEq: vi.fn(),
  membershipUpdate2: vi.fn(),
  membershipUpdate2Eq: vi.fn(),
  membershipSelect: vi.fn(),
  membershipSelectEq: vi.fn(),
  membershipSelectSingle: vi.fn(),
  profilesUpdate: vi.fn(),
  profilesUpdateEq: vi.fn(),
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
          update: mocks.profilesUpdate.mockImplementation(() => ({
            eq: mocks.profilesUpdateEq,
          })),
        };
      }
      if (table === "membership_requests") {
        return {
          update: mocks.membershipUpdate.mockImplementation(() => ({
            eq: mocks.membershipUpdateEq,
          })),
          select: mocks.membershipSelect.mockImplementation(() => ({
            eq: mocks.membershipSelectEq.mockImplementation(() => ({
              single: mocks.membershipSelectSingle,
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

const makeFormData = (requestId = "req-001") => {
  const fd = new FormData();
  fd.set("requestId", requestId);
  return fd;
};

describe("approveRequest", () => {
  it("allows platform admin to approve a pending request and updates profile tier", async () => {
    setupAuth("admin-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq.mockResolvedValue({ error: null });
    mocks.membershipSelectSingle.mockResolvedValue({
      data: { profile_id: "tourist-1", tier_solicitado: "standard" },
    });
    mocks.profilesUpdateEq.mockResolvedValue({ error: null });

    try {
      await approveRequest(null, makeFormData());
    } catch {
      // redirect throws
    }

    expect(mocks.membershipUpdate).toHaveBeenCalledWith({
      estado: "aprobada",
      revisado_por: "admin-user-id",
      actualizado_en: expect.any(String),
    });
    expect(mocks.membershipUpdateEq).toHaveBeenCalledWith("id", "req-001");
    expect(mocks.profilesUpdate).toHaveBeenCalledWith({ tier: "standard" });
    expect(mocks.profilesUpdateEq).toHaveBeenCalledWith("id", "tourist-1");
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await approveRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membershipUpdate).not.toHaveBeenCalled();
  });

  it("returns error when user is not platform admin", async () => {
    setupAuth("regular-user-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede aprobar solicitudes" });
    expect(mocks.membershipUpdate).not.toHaveBeenCalled();
  });

  it("returns error when membership update fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq.mockResolvedValue({ error: { message: "Error al actualizar" } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Error al actualizar" });
  });

  it("returns error when profile fetch for tier update fails and rolls back membership status", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    mocks.membershipSelectSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solicitud no encontrada" });
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
    expect(mocks.membershipUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.membershipUpdate).toHaveBeenNthCalledWith(2, {
      estado: "pendiente",
      revisado_por: null,
      actualizado_en: expect.any(String),
    });
  });

  it("rolls back membership status when tier update fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.membershipUpdateEq
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    mocks.membershipSelectSingle.mockResolvedValue({
      data: { profile_id: "tourist-1", tier_solicitado: "standard" },
    });
    mocks.profilesUpdateEq.mockResolvedValue({ error: { message: "Tier update failed" } });

    const result = await approveRequest(null, makeFormData());

    expect(result).toEqual({ error: "Error al actualizar el tier del perfil" });
    expect(mocks.membershipUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.membershipUpdate).toHaveBeenNthCalledWith(2, {
      estado: "pendiente",
      revisado_por: null,
      actualizado_en: expect.any(String),
    });
    expect(mocks.membershipUpdateEq).toHaveBeenCalledTimes(2);
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
    expect(mocks.profilesUpdate).not.toHaveBeenCalled();
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
