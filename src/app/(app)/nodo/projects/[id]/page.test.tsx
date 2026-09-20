import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import ProjectDetailPlaceholderPage from "./page";

describe("ProjectDetailPlaceholderPage", () => {
  it("resolves the detail route and shows the project id", async () => {
    const ui = await ProjectDetailPlaceholderPage({
      params: Promise.resolve({ id: "proj-abc" }),
    });
    render(ui);
    expect(screen.getByText(/proj-abc/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver a proyectos" })).toHaveAttribute(
      "href",
      "/nodo/projects",
    );
  });
});
