import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  pendingMaybeSingle: vi.fn(),
  membershipInsert: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mocks.profilesSelectSingle,
            })),
          })),
        };
      }
      if (table === "membership_requests") {
        return {
          insert: mocks.membershipInsert,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mocks.pendingMaybeSingle,
              })),
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
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

import { createMembershipRequest } from "./actions";

function setupAuth(userId = "test-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function setupTourist() {
  setupAuth();
  mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
  mocks.pendingMaybeSingle.mockResolvedValue({ data: null, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createMembershipRequest", () => {
  it("creates a membership request and redirects to /solicitar/enviado on success", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = new FormData();
    fd.set("mensaje", "Quiero ayudar con la huerta");

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      mensaje: "Quiero ayudar con la huerta",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/solicitar/enviado");
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns a generic error when insert fails", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({
      error: { message: "new row violates row-level security policy" },
    });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No pudimos enviar tu solicitud. Probá de nuevo." });
  });

  it("stores null when mensaje is absent or only whitespace", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = new FormData();
    fd.set("mensaje", "   ");

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      mensaje: null,
    });
  });

  it("ignores a non-string mensaje field", async () => {
    setupTourist();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = new FormData();
    fd.set("mensaje", new File(["x"], "note.txt", { type: "text/plain" }));

    await expect(createMembershipRequest(null, fd)).rejects.toThrow(
      "NEXT_REDIRECT:/solicitar/enviado",
    );

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      mensaje: null,
    });
  });

  it("rejects non-tourist profiles without inserting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" }, error: null });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "Solo los tourists pueden solicitar membresía." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns a generic error when the profile read fails", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No pudimos enviar tu solicitud. Probá de nuevo." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("rejects a second pending request without inserting", async () => {
    setupAuth();
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({ data: { id: "req-1" }, error: null });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "Ya tenes una solicitud pendiente." });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });
});
