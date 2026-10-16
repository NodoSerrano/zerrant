import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  profileMaybeSingle: vi.fn(),
  requestMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "membership_requests") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({ limit: () => ({ maybeSingle: mocks.requestMaybeSingle }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: mocks.profileMaybeSingle }),
        }),
      };
    }),
  }),
}));

import { resolveSerSerranoCtaVisibility } from "./ser-serrano-cta-server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveSerSerranoCtaVisibility (ZER-171)", () => {
  it("returns true for tourist without active request", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.requestMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(resolveSerSerranoCtaVisibility("u1")).resolves.toBe(true);
  });

  it("returns false for tourist with active request", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.requestMaybeSingle.mockResolvedValue({ data: { id: "r1" }, error: null });

    await expect(resolveSerSerranoCtaVisibility("u1")).resolves.toBe(false);
  });

  it("returns false for members", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { tier: "member" }, error: null });

    await expect(resolveSerSerranoCtaVisibility("u1")).resolves.toBe(false);
    expect(mocks.requestMaybeSingle).not.toHaveBeenCalled();
  });

  it("returns false when profile is missing", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(resolveSerSerranoCtaVisibility("u1")).resolves.toBe(false);
  });

  it("fails closed when request read fails for a tourist", async () => {
    mocks.profileMaybeSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.requestMaybeSingle.mockResolvedValue({ data: null, error: { message: "db" } });

    await expect(resolveSerSerranoCtaVisibility("u1")).resolves.toBe(false);
  });

  it("reuses a page client and a known tier instead of opening another client", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = await createClient();
    (createClient as ReturnType<typeof vi.fn>).mockClear();
    mocks.requestMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(resolveSerSerranoCtaVisibility("u1", { client, tier: "tourist" })).resolves.toBe(
      true,
    );

    expect(createClient).not.toHaveBeenCalled();
    expect(mocks.profileMaybeSingle).not.toHaveBeenCalled();
    expect(mocks.requestMaybeSingle).toHaveBeenCalled();
  });

  it("skips the request read when the page already knows a non-tourist tier", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = await createClient();
    (createClient as ReturnType<typeof vi.fn>).mockClear();

    await expect(resolveSerSerranoCtaVisibility("u1", { client, tier: "member" })).resolves.toBe(
      false,
    );

    expect(createClient).not.toHaveBeenCalled();
    expect(mocks.profileMaybeSingle).not.toHaveBeenCalled();
    expect(mocks.requestMaybeSingle).not.toHaveBeenCalled();
  });
});
