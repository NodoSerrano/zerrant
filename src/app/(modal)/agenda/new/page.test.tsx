import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("./NewEventForm", () => ({
  NewEventForm: () => (
    <div>
      <h1>Nuevo evento</h1>
      <div data-testid="event-form" />
    </div>
  ),
}));

import NewEventPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NewEventPage", () => {
  it("redirects unauthenticated users to login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(NewEventPage()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects tourists away from the form", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "t1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "tourist" },
      error: null,
    });

    await expect(NewEventPage()).rejects.toThrow("NEXT_REDIRECT:/agenda");
  });

  it("renders the create form for a serrano", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "s1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({
      data: { tier: "standard" },
      error: null,
    });

    render(await NewEventPage());

    expect(screen.getByText("Nuevo evento")).toBeTruthy();
    expect(screen.getByTestId("event-form")).toBeTruthy();
  });
});
