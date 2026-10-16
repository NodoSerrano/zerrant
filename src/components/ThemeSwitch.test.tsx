import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockToggle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/useTheme", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "@/lib/useTheme";
import { ThemeSwitch } from "./ThemeSwitch";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ThemeSwitch", () => {
  it("is checked with the primary track in dark mode", () => {
    vi.mocked(useTheme).mockReturnValue({ dark: true, toggle: mockToggle });
    render(<ThemeSwitch />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAttribute("aria-label", "Cambiar a modo claro");
    expect(sw.className).toContain("bg-primary");
  });

  it("is unchecked with the muted track in light mode", () => {
    vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
    render(<ThemeSwitch />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAttribute("aria-label", "Cambiar a modo oscuro");
    expect(sw.className).toContain("bg-text-muted");
  });

  it("calls toggle when clicked", () => {
    vi.mocked(useTheme).mockReturnValue({ dark: false, toggle: mockToggle });
    render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole("switch"));
    expect(mockToggle).toHaveBeenCalledOnce();
  });
});
