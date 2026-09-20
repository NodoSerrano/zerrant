import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
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
  redirect: (url: string) => mocks.redirect(url),
}));

vi.mock("./NewAporteForm", () => ({
  NewAporteForm: ({ isPlatformAdmin }: { isPlatformAdmin: boolean }) => (
    <div>
      <h1>Registrar aporte</h1>
      <div data-testid="aporte-form" data-admin={String(isPlatformAdmin)} />
    </div>
  ),
}));

import NewAportePage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NewAportePage", () => {
  it("redirects unauthenticated users to login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(NewAportePage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects tourists away from the form", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "t1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "tourist", is_platform_admin: false },
      error: null,
    });

    await expect(NewAportePage()).rejects.toThrow("NEXT_REDIRECT:/profile");
  });

  it("renders the register form for a serrano", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "s1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard", is_platform_admin: false },
      error: null,
    });

    render(await NewAportePage());

    expect(screen.getByText("Registrar aporte")).toBeTruthy();
    expect(screen.getByTestId("aporte-form").getAttribute("data-admin")).toBe("false");
  });

  it("passes isPlatformAdmin to the form for admins", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "a1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "founder", is_platform_admin: true },
      error: null,
    });

    render(await NewAportePage());

    expect(screen.getByTestId("aporte-form").getAttribute("data-admin")).toBe("true");
  });
});
