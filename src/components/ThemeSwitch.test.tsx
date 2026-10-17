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

function renderSwitch(dark: boolean) {
  vi.mocked(useTheme).mockReturnValue({ dark, toggle: mockToggle });
  render(
    <>
      <span id="modo-oscuro-label">Modo oscuro</span>
      <ThemeSwitch labelledBy="modo-oscuro-label" />
    </>,
  );
  return screen.getByRole("switch");
}

describe("ThemeSwitch", () => {
  it("is checked with the primary track in dark mode", () => {
    const sw = renderSwitch(true);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAttribute("aria-labelledby", "modo-oscuro-label");
    expect(sw).not.toHaveAttribute("aria-label");
    expect(sw).toHaveAccessibleName("Modo oscuro");
    expect(sw.className).toContain("bg-primary");
  });

  it("is unchecked with the muted track in light mode", () => {
    const sw = renderSwitch(false);
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAttribute("aria-labelledby", "modo-oscuro-label");
    expect(sw).not.toHaveAttribute("aria-label");
    expect(sw).toHaveAccessibleName("Modo oscuro");
    expect(sw.className).toContain("bg-text-muted");
  });

  it("uses the on-primary token for the knob, not bg-white", () => {
    const sw = renderSwitch(true);
    expect(sw.innerHTML).not.toMatch(/\bbg-white\b/);
    expect(sw.innerHTML).toMatch(/\bbg-on-primary\b/);
  });

  it("calls toggle when clicked", () => {
    const sw = renderSwitch(false);
    fireEvent.click(sw);
    expect(mockToggle).toHaveBeenCalledOnce();
  });
});
