import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  profilesSelectSingle: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: mocks.profilesSelectSingle,
            }),
          }),
        };
      }
      return {};
    }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { bookInterviewSlot, createInterviewSlot } from "./interview-actions";

const SLOT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bookInterviewSlot", () => {
  it("calls the booking RPC and surfaces a unique-slot conflict", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.rpc.mockResolvedValue({
      data: { error: "Ese horario acaba de ocuparse. Elegí otro.", code: "conflict" },
      error: null,
    });
    const fd = new FormData();
    fd.set("slotId", SLOT);

    const result = await bookInterviewSlot(null, fd);

    expect(mocks.rpc).toHaveBeenCalledWith("book_interview_slot", { p_slot_id: SLOT });
    expect(result).toEqual({ error: "Ese horario acaba de ocuparse. Elegí otro." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates applicant and admin surfaces on success", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.rpc.mockResolvedValue({ data: { success: true, id: "b1" }, error: null });
    const fd = new FormData();
    fd.set("slotId", SLOT);

    await expect(bookInterviewSlot(null, fd)).resolves.toEqual({
      success: "Reservaste tu entrevista",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/membresias");
  });

  it("rejects a malformed slot id without hitting the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const fd = new FormData();
    fd.set("slotId", "nope");
    await expect(bookInterviewSlot(null, fd)).resolves.toEqual({ error: "Horario inválido" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("createInterviewSlot", () => {
  it("converts ART wall clock before calling the RPC", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });
    mocks.rpc.mockResolvedValue({ data: { success: true, id: "s1" }, error: null });
    const fd = new FormData();
    fd.set("startsAt", "2026-10-07T15:00");

    await expect(createInterviewSlot(null, fd)).resolves.toEqual({ success: "Horario publicado" });
    expect(mocks.rpc).toHaveBeenCalledWith("create_interview_slot", {
      p_starts_at: "2026-10-07T18:00:00.000Z",
      p_minutes: 30,
    });
  });

  it("rejects non-admins", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });
    const fd = new FormData();
    fd.set("startsAt", "2026-10-07T15:00");
    await expect(createInterviewSlot(null, fd)).resolves.toEqual({
      error: "Solo un admin puede publicar horarios",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
