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
});
