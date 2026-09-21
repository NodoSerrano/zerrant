import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InicioHubSkeleton } from "./InicioHubSkeleton";

describe("InicioHubSkeleton", () => {
  it("shows Inicio structure placeholders instead of a blank flash", () => {
    const { container } = render(<InicioHubSkeleton />);

    expect(screen.getByRole("status", { name: /Cargando inicio/i })).toBeInTheDocument();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Próximos eventos")).toBeInTheDocument();
    expect(screen.getByText("Próximos cumpleaños")).toBeInTheDocument();
    // At least two section card placeholders (events + birthdays).
    expect(container.querySelectorAll("[data-skeleton='card']").length).toBeGreaterThanOrEqual(2);
  });

  it("uses fixed card heights so late section content does not collapse the layout", () => {
    const { container } = render(<InicioHubSkeleton />);
    const cards = [...container.querySelectorAll("[data-skeleton='card']")];
    expect(cards.some((el) => el.className.includes("h-[88px]"))).toBe(true);
    expect(cards.some((el) => el.className.includes("h-[72px]"))).toBe(true);
  });
});
