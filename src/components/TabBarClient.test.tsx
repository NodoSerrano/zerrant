import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TabBarClient } from "./TabBarClient";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { usePathname } from "next/navigation";

describe("TabBarClient", () => {
  it("marks plantel active when pathname starts with /plantel", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/plantel");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /PLANTEL/i })).toHaveClass("bg-primary");
  });

  it("marks nodo active when pathname starts with /nodo", () => {
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/nodo/tasks");
    render(<TabBarClient />);
    expect(screen.getByRole("link", { name: /NODO/i })).toHaveClass("bg-primary");
  });
});
