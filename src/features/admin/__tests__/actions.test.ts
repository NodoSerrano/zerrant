import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
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
  revalidatePath: mocks.revalidatePath,
}));

import { transitionRequest } from "../actions";

beforeEach(() => {
  vi.clearAllMocks();
});

function setupAdmin() {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-user-id" } } });
  mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
}

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

const makeFormData = (to: string = "entrevista_solicitada", requestId = VALID_UUID) => {
  const fd = new FormData();
  fd.set("requestId", requestId);
  fd.set("to", to);
  return fd;
};

describe("transitionRequest", () => {
  it("calls the transition RPC and returns the new estado label on success", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({
      data: { success: true, estado: "entrevista_solicitada" },
      error: null,
    });

    const result = await transitionRequest(null, makeFormData("entrevista_solicitada"));

    expect(mocks.rpc).toHaveBeenCalledWith("transition_membership_request", {
      p_request_id: VALID_UUID,
      p_to: "entrevista_solicitada",
    });
    expect(result).toEqual({ success: "Estado actualizado: Entrevista solicitada" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile", "layout");
  });

  it.each([
    "forbidden",
    "not_found",
    "invalid_transition",
    "unsupported_tier",
    "invalid_motivo",
    "conflict",
  ])("surfaces the RPC error for code %s without revalidating", async (code) => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({ data: { error: `msg ${code}`, code }, error: null });

    const result = await transitionRequest(null, makeFormData("cerrada"));

    expect(result).toEqual({ error: `msg ${code}` });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic error when the RPC call itself fails", async () => {
    setupAdmin();
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "No pudimos actualizar la solicitud" });
  });

  it("rejects an invalid target estado without calling the RPC", async () => {
    setupAdmin();

    const result = await transitionRequest(null, makeFormData("pendiente"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed request id without calling the RPC", async () => {
    setupAdmin();

    const result = await transitionRequest(null, makeFormData("cerrada", "not-a-uuid"));

    expect(result).toEqual({ error: "Solicitud inválida" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects non-admin users without calling the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "Solo un admin puede gestionar solicitudes" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await transitionRequest(null, makeFormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
