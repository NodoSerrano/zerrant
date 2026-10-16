import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PipelineProgress } from "./PipelineProgress";
import { screenProgress } from "@/features/membership/pipeline";

describe("PipelineProgress (Pencil p1rv1X)", () => {
  it("shows the current step name and its position out of 8", () => {
    render(<PipelineProgress progress={screenProgress("perfil", { emailConfirmed: true })} />);

    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Paso 3 de 8")).toBeInTheDocument();
  });

  it("exposes an accessible progressbar", () => {
    render(<PipelineProgress progress={screenProgress("solicitud", { emailConfirmed: true })} />);
    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuemin", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
    expect(bar).toHaveAttribute("aria-valuenow", "4");
    expect(bar).toHaveAttribute("aria-valuetext", "Paso 4 de 8: Solicitud");
  });

  it("renders one segment per step carrying its status", () => {
    const { container } = render(
      <PipelineProgress progress={screenProgress("solicitud", { emailConfirmed: false })} />,
    );
    const segs = Array.from(container.querySelectorAll("[data-segment]")).map((s) =>
      s.getAttribute("data-status"),
    );

    expect(segs).toEqual([
      "done",
      "pending",
      "done",
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });
});
