import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profilesSelectSingle: vi.fn(),
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
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import AdminLayout from "../layout";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminLayout", () => {
  it("redirects unauthenticated users to /auth/login", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow(
      "NEXT_REDIRECT:/auth/login",
    );
    expect(mocks.profilesSelectSingle).not.toHaveBeenCalled();
  });

  it("redirects non-admins to /nodo/tasks", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: false } });

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/tasks",
    );
  });

  it("renders children for platform admins", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mocks.profilesSelectSingle.mockResolvedValue({ data: { is_platform_admin: true } });

    const element = await AdminLayout({ children: <div>admin content</div> });
    render(element);
    expect(screen.getByText("admin content")).toBeInTheDocument();
  });
});
