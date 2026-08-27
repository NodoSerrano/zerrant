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

// redirect() cuts execution by throwing. We replicate that so the server
// component doesn't keep rendering after redirecting, same as in production.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// The form is a client component with its own tests; here we only care
// about whether the page renders it or not.
vi.mock("./NewTaskForm", () => ({
  NewTaskForm: () => null,
}));

import NewTaskPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

function setUser(id: string | null) {
  mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

async function renderPage() {
  return await NewTaskPage();
}

describe("NewTaskPage — authorization guard (AC7)", () => {
  it("redirects an unauthenticated user to /auth/login", async () => {
    setUser(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("does not query the profile when there is no user", async () => {
    setUser(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.profilesSelect).not.toHaveBeenCalled();
  });

  it("redirects a tourist to /nodo/tasks", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
    expect(mocks.redirect).toHaveBeenCalledWith("/nodo/tasks");
  });

  it("redirects a user with no profile to /nodo/tasks", async () => {
    setUser("no-profile-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: null });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
    expect(mocks.redirect).toHaveBeenCalledWith("/nodo/tasks");
  });

  it("reads only the tier column, scoped to the current user", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    await renderPage();

    expect(mocks.profilesSelect).toHaveBeenCalledWith("tier");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "serrano-id");
  });

  it("renders the form for a serrano without redirecting", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    const result = await renderPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("renders the form when the profile read fails for a reason other than 'no rows'", async () => {
    setUser("serrano-id");
    // 57014 = query cancelled by timeout. We don't know the tier: locking out a
    // legitimate serrano is worse than letting them through, because `createTask`
    // re-checks before inserting. Same criterion as `src/proxy.ts`.
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    const result = await renderPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("logs the profile read failure instead of swallowing it", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    await renderPage();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("still redirects when the profile genuinely does not exist (PGRST116)", async () => {
    setUser("no-profile-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "The result contains 0 rows" },
    });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
  });

  it("does not render the form for a tourist", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    // The redirect throw guarantees the form render is never reached.
    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
  });
});
