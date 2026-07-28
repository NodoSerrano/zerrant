import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  membershipInsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          insert: mocks.membershipInsert,
        };
      }
      return {};
    }),
  }),
}));

import { createMembershipRequest } from "./actions";

function setupAuth(userId = "test-user-id") {
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createMembershipRequest", () => {
  it("creates a membership request and redirects on success", async () => {
    setupAuth();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    const fd = new FormData();
    fd.set("mensaje", "Quiero ayudar con la huerta");

    try {
      await createMembershipRequest(null, fd);
    } catch {
      // redirect throws
    }

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      mensaje: "Quiero ayudar con la huerta",
    });
  });

  it("returns error when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "No autorizado" });
    expect(mocks.membershipInsert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    setupAuth();
    mocks.membershipInsert.mockResolvedValue({
      error: { message: "Ya tenes una solicitud pendiente" },
    });

    const result = await createMembershipRequest(null, new FormData());

    expect(result).toEqual({ error: "Ya tenes una solicitud pendiente" });
  });

  it("sends empty mensaje when field is absent", async () => {
    setupAuth();
    mocks.membershipInsert.mockResolvedValue({ error: null });

    try {
      await createMembershipRequest(null, new FormData());
    } catch {
      // redirect throws
    }

    expect(mocks.membershipInsert).toHaveBeenCalledWith({
      profile_id: "test-user-id",
      mensaje: "",
    });
  });
});
