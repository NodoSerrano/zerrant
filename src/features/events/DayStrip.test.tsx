import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayStrip } from "./DayStrip";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-current": ariaCurrent,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-current"?: boolean | "true" | "false" | "date" | "time" | "location" | "page" | "step";
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));
const DAYS = [
  { key: "2026-09-20", weekdayShort: "dom", dayNumber: "20" },
  { key: "2026-09-21", weekdayShort: "lun", dayNumber: "21" },
  { key: "2026-09-22", weekdayShort: "mar", dayNumber: "22" },
];

describe("DayStrip", () => {
  it("renders each day as a link with ?dia=", () => {
    render(<DayStrip days={DAYS} selectedKey="2026-09-20" />);

    const link20 = screen.getByRole("link", { name: /dom\s*20/i });
    const link21 = screen.getByRole("link", { name: /lun\s*21/i });

    expect(link20).toHaveAttribute("href", "/agenda?dia=2026-09-20");
    expect(link21).toHaveAttribute("href", "/agenda?dia=2026-09-21");
  });

  it("marks the selected day", () => {
    render(<DayStrip days={DAYS} selectedKey="2026-09-21" />);

    const selected = screen.getByRole("link", { name: /lun\s*21/i });
    expect(selected).toHaveAttribute("aria-current", "date");
    expect(selected.className).toMatch(/bg-primary|text-on-primary/);
  });
});
