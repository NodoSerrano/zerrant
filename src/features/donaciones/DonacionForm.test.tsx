import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DonacionForm } from "./DonacionForm";

describe("DonacionForm", () => {
  it("renders title, tipo regalo/por un tiempo, optional image, no valor estimado", () => {
    render(<DonacionForm action={async () => null} />);

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByText("Regalo")).toBeInTheDocument();
    expect(screen.getByText("Por un tiempo")).toBeInTheDocument();
    expect(screen.getByLabelText(/foto/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/valor|monto/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/desde/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar donación/i })).toBeInTheDocument();
  });

  it("shows optional prestamo date fields only for por un tiempo", () => {
    render(<DonacionForm action={async () => null} />);

    expect(screen.queryByLabelText(/desde/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /por un tiempo/i }));

    expect(screen.getByLabelText(/desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasta/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/valor|monto/i)).not.toBeInTheDocument();
  });
});
