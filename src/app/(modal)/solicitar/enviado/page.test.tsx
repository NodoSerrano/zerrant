import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  pendingMaybeSingle: vi.fn(),
  activeIn: vi.fn(),
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
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: mocks.activeIn.mockReturnValue({
                maybeSingle: mocks.pendingMaybeSingle,
              }),
            })),
          })),
        };
      }
      return {};
    }),
  }),
}));

const flow = vi.hoisted(() => ({ getFlowProgress: vi.fn() }));
vi.mock("@/features/membership/flow-progress", () => ({ getFlowProgress: flow.getFlowProgress }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("./EnviadoConfirmation", () => ({
  EnviadoConfirmation: () => <div data-testid="enviado-confirmation" />,
}));

import EnviadoPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

function setUser(id: string | null) {
  mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

describe("EnviadoPage — guards", () => {
  it("redirects unauthenticated users to /auth/login", async () => {
    setUser(null);

    await expect(EnviadoPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects non-tourists to /profile", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard" },
      error: null,
    });

    await expect(EnviadoPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("redirects tourists without a pending request to /profile", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(EnviadoPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("fail-closes to /profile when the profile read errors", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "timeout" },
    });

    await expect(EnviadoPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("fail-closes to /profile when the pending-request read errors", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "timeout" },
    });

    await expect(EnviadoPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("renders the confirmation for a tourist with a pending request", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({ data: { id: "req-1" }, error: null });

    const result = await EnviadoPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("forwards the Horario flow progress to the confirmation (ZER-136)", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" }, error: null });
    mocks.pendingMaybeSingle.mockResolvedValue({ data: { id: "req-1" }, error: null });
    const progress = { current: 5, steps: [] };
    flow.getFlowProgress.mockResolvedValue(progress);

    const result = await EnviadoPage();

    expect(flow.getFlowProgress).toHaveBeenCalledWith("horario");
    expect(result.props.progress).toBe(progress);
  });
});
