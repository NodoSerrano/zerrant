import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InicioLoading from "./loading";

describe("Inicio loading.tsx (FR58)", () => {
  it("renders the Inicio skeleton treatment for primary hub fetches", () => {
    const { container } = render(<InicioLoading />);
    expect(screen.getByRole("status", { name: /Cargando inicio/i })).toBeInTheDocument();
    expect(container.querySelector('[data-testid="inicio-hub-skeleton"]')).toBeTruthy();
  });
});
