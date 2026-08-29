import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mocks.profilesSelectSingle,
        })),
      })),
    })),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("./MisAportesScreen", () => ({
  MisAportesScreen: () => <div data-testid="mis-aportes-screen" />,
}));

import AportesPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

function setUser(id: string | null) {
  mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

describe("AportesPage — guards", () => {
  it("redirects unauthenticated users to /auth/login", async () => {
    setUser(null);

    await expect(AportesPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects tourists to /profile", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "tourist" },
      error: null,
    });

    await expect(AportesPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("fail-closes to /profile when the profile read errors", async () => {
    setUser("user-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "timeout" },
    });

    await expect(AportesPage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("renders MisAportesScreen for a serrano", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard" },
      error: null,
    });

    const result = await AportesPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
