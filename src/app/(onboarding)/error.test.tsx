import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingError from "./error";

describe("Onboarding error boundary", () => {
  it("offers an in-flow retry without leaving onboarding", () => {
    const reset = vi.fn();
    render(<OnboardingError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Algo salió mal en el alta. Podés reintentar sin salir del flujo.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
