import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppError from "./error";

describe("(app) error boundary (7.5 recoverable)", () => {
  it("shows designed offline/error surface and in-flow reset", () => {
    const reset = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<AppError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Sin conexión" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Revisá tu internet\. Mientras tanto te mostramos lo último que guardamos en el dispositivo\./,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
