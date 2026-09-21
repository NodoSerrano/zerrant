import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TouristMenu } from "./TouristMenu";

vi.mock("@/lib/useTheme", () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}));

vi.mock("@/features/auth/actions", () => ({
  signOut: vi.fn(),
}));

describe("TouristMenu theme toggle (ZER-103)", () => {
  it("uses surface token for the switch knob, not bg-white", () => {
    render(<TouristMenu />);
    const toggle = screen.getByRole("button", { name: /modo oscuro|modo claro/i });
    expect(toggle.innerHTML).not.toMatch(/\bbg-white\b/);
    expect(toggle.innerHTML).toMatch(/\bbg-surface\b/);
  });
});
