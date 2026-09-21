import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

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

describe("EmptyState a11y (ZER-104)", () => {
  it("marks decorative icons aria-hidden so headings own the name", () => {
    const { container } = render(
      <EmptyState title="No hay eventos próximos" subtitle="Cuando se publiquen…" />,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("keeps CTA as a named link when href is provided", () => {
    render(
      <EmptyState
        title="No hay tareas"
        subtitle="Publicá una"
        href="/nodo/tasks/new"
        actionLabel="Publicar tarea"
      />,
    );
    expect(screen.getByRole("link", { name: /Publicar tarea/i })).toHaveAttribute(
      "href",
      "/nodo/tasks/new",
    );
  });
});
