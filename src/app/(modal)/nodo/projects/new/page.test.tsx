import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: mocks.profilesSelect.mockImplementation(() => ({
        eq: mocks.profilesSelectEq.mockImplementation(() => ({
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

vi.mock("./NewProjectForm", () => ({
  NewProjectForm: () => null,
}));

import NewProjectPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

function setUser(id: string | null) {
  mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

describe("NewProjectPage — tourist guard (UX; RLS is the real gate)", () => {
  it("redirects an unauthenticated user to /auth/login", async () => {
    setUser(null);

    await expect(NewProjectPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("redirects a tourist to /nodo/projects", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    await expect(NewProjectPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/projects");
    expect(mocks.redirect).toHaveBeenCalledWith("/nodo/projects");
  });

  it("renders the form for a serrano without redirecting", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await NewProjectPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("still redirects when the profile genuinely does not exist (PGRST116)", async () => {
    setUser("no-profile-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "The result contains 0 rows" },
    });

    await expect(NewProjectPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/projects");
  });
});
