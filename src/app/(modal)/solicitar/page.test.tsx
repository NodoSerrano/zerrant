import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelect: vi.fn(),
  profilesSelectEq: vi.fn(),
  profilesSelectSingle: vi.fn(),
  redirect: vi.fn(),
  closedEq: vi.fn(),
  closedMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) =>
      table === "membership_requests"
        ? {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: mocks.closedEq.mockImplementation(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({ maybeSingle: mocks.closedMaybeSingle })),
                  })),
                })),
              })),
            })),
          }
        : {
            select: mocks.profilesSelect.mockImplementation(() => ({
              eq: mocks.profilesSelectEq.mockImplementation(() => ({
                single: mocks.profilesSelectSingle,
              })),
            })),
          },
    ),
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

vi.mock("./SolicitarForm", () => ({
  SolicitarForm: () => null,
}));

import SolicitarPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.closedMaybeSingle.mockResolvedValue({ data: null, error: null });
});

function setUser(id: string | null) {
  mocks.getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

async function renderPage() {
  return await SolicitarPage();
}

describe("SolicitarPage — authorization", () => {
  it("redirects unauthenticated users to /auth/login carrying next (ZER-136)", async () => {
    setUser(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login?next=%2Fsolicitar");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login?next=%2Fsolicitar");
  });

  it("does not query profile when there is no user", async () => {
    setUser(null);

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.profilesSelect).not.toHaveBeenCalled();
  });

  it("reads only the tier column, scoped to the current user", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    await renderPage();

    expect(mocks.profilesSelect).toHaveBeenCalledWith("tier");
    expect(mocks.profilesSelectEq).toHaveBeenCalledWith("id", "tourist-id");
  });

  it("renders the form for a tourist", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });

    const result = await renderPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("redirects serranos to /nodo/tasks", async () => {
    setUser("serrano-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "standard" } });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
    expect(mocks.redirect).toHaveBeenCalledWith("/nodo/tasks");
  });

  it("redirects founders to /nodo/tasks", async () => {
    setUser("founder-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "founder" } });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
    expect(mocks.redirect).toHaveBeenCalledWith("/nodo/tasks");
  });

  it("renders the form when profile read fails (not PGRST116)", async () => {
    setUser("maybe-tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    });

    const result = await renderPage();

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it("redirects when profile does not exist (PGRST116)", async () => {
    setUser("no-profile");
    mocks.profilesSelectSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "The result contains 0 rows" },
    });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/nodo/tasks");
  });
});

describe("SolicitarPage — re-application after cerrada (ZER-180)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-26T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends a tourist whose request closed less than 30 days ago to the status page", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });
    mocks.closedMaybeSingle.mockResolvedValue({
      data: { cerrada_en: "2026-10-20T15:00:00.000Z", reapertura_habilitada_en: null },
      error: null,
    });

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT:/solicitar/estado");
    expect(mocks.closedEq).toHaveBeenCalledWith("estado", "cerrada");
  });

  it("renders the form once the 30 days are over", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });
    mocks.closedMaybeSingle.mockResolvedValue({
      data: { cerrada_en: "2026-09-01T15:00:00.000Z", reapertura_habilitada_en: null },
      error: null,
    });

    expect(await renderPage()).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("renders the form earlier when an admin enabled it", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });
    mocks.closedMaybeSingle.mockResolvedValue({
      data: {
        cerrada_en: "2026-10-25T15:00:00.000Z",
        reapertura_habilitada_en: "2026-10-26T10:00:00.000Z",
      },
      error: null,
    });

    expect(await renderPage()).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("still renders the form when the cerrada read fails (the action fails closed)", async () => {
    setUser("tourist-id");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });
    mocks.closedMaybeSingle.mockResolvedValue({ data: null, error: { code: "500" } });

    expect(await renderPage()).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("SolicitarPage — membership flow (ZER-136)", () => {
  it("forwards the Solicitud flow progress to the form", async () => {
    setUser("tourist-id");
    mocks.profilesSelectSingle.mockResolvedValue({ data: { tier: "tourist" } });
    const progress = { current: 4, steps: [] };
    flow.getFlowProgress.mockResolvedValue(progress);

    const result = await renderPage();

    expect(flow.getFlowProgress).toHaveBeenCalledWith("solicitud");
    expect(result.props.progress).toBe(progress);
  });
});
