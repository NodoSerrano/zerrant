import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormFeedback } from "./FormFeedback";

describe("FormFeedback", () => {
  it("announces an error as an alert", () => {
    render(<FormFeedback error="No pudimos guardar" />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos guardar");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces a success as a status", () => {
    render(<FormFeedback success="Reservaste tu entrevista" />);
    expect(screen.getByRole("status")).toHaveTextContent("Reservaste tu entrevista");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prefers the error when both are set", () => {
    render(<FormFeedback error="Falló" success="Listo" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falló");
    expect(screen.queryByText("Listo")).not.toBeInTheDocument();
  });

  it("renders nothing without a message", () => {
    const { container } = render(<FormFeedback error={null} success={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
