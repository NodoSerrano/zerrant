import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flow: undefined as string | undefined,
  user: null as { email_confirmed_at?: string | null } | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (n === "ns_flujo" && mocks.flow ? { value: mocks.flow } : undefined),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
  })),
}));

import { getFlowProgress } from "./flow-progress";

beforeEach(() => {
  mocks.flow = undefined;
  mocks.user = { email_confirmed_at: "2026-10-01T00:00:00Z" };
});

describe("getFlowProgress", () => {
  it("returns null outside the membership flow (tourist path unchanged)", async () => {
    expect(await getFlowProgress("perfil")).toBeNull();
  });

  it("returns the screen progress inside the flow", async () => {
    mocks.flow = "membresia";
    const p = await getFlowProgress("solicitud");

    expect(p?.current).toBe(4);
    expect(p?.steps[1].status).toBe("done");
  });

  it("reflects an unconfirmed email without blocking", async () => {
    mocks.flow = "membresia";
    mocks.user = { email_confirmed_at: null };

    expect((await getFlowProgress("perfil"))?.steps[1].status).toBe("pending");
  });

  it("ignores a forged cookie value", async () => {
    mocks.flow = "otra";
    expect(await getFlowProgress("perfil")).toBeNull();
  });
});
