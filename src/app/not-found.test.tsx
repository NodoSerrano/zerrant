import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

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

vi.mock("@/components/TabBarClient", () => ({
  TabBarClient: () => <nav data-testid="tab-bar" aria-label="TabBar" />,
}));

describe("app not-found (7.6)", () => {
  it("renders designed 404 copy and home CTA instead of a blank framework default", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "Perdiste el rumbo" })).toBeInTheDocument();
    expect(
      screen.getByText("No encontramos esta página. Puede que ya no exista."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir al inicio/i })).toHaveAttribute("href", "/");
    expect(document.querySelector("svg.lucide-compass")).toBeTruthy();
    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
  });
});
