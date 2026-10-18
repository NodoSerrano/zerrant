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
  it("names the dark-mode switch from the visible Modo oscuro text", () => {
    render(<TouristMenu />);
    const label = screen.getByText("Modo oscuro");
    const toggle = screen.getByRole("switch");
    // A <label> around the switch would be a second, competing name source.
    expect(toggle.closest("label")).toBeNull();
    expect(label).toHaveAttribute("id", "tourist-dark-mode-label");
    expect(toggle).toHaveAttribute("aria-labelledby", label.id);
    expect(toggle).not.toHaveAttribute("aria-label");
    expect(toggle).toHaveAccessibleName("Modo oscuro");
  });
});
