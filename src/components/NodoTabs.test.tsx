import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NodoTabs } from "./NodoTabs";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    role,
    "aria-selected": ariaSelected,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    role?: string;
    "aria-selected"?: boolean;
  }) => (
    <a href={href} className={className} role={role} aria-selected={ariaSelected}>
      {children}
    </a>
  ),
}));

describe("NodoTabs", () => {
  it("renders both halves as real links", () => {
    render(<NodoTabs active="tareas" />);
    expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("href", "/nodo/tasks");
    expect(screen.getByRole("tab", { name: "Proyectos" })).toHaveAttribute(
      "href",
      "/nodo/projects",
    );
  });

  it("marks Tareas active on the tasks half", () => {
    render(<NodoTabs active="tareas" />);
    expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Proyectos" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: "Tareas" }).className).toContain("bg-surface");
    expect(screen.getByRole("tab", { name: "Proyectos" }).className).toContain("text-text-muted");
  });

  it("marks Proyectos active on the projects half", () => {
    render(<NodoTabs active="proyectos" />);
    expect(screen.getByRole("tab", { name: "Proyectos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tareas" })).toHaveAttribute("aria-selected", "false");
  });

  it("never renders a cursor-default span for Proyectos", () => {
    const { container } = render(<NodoTabs active="tareas" />);
    expect(container.querySelector("span.cursor-default")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("a")).some((a) => a.textContent === "Proyectos"),
    ).toBe(true);
  });
});
