import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AporteItem } from "./AporteItem";

describe("AporteItem", () => {
  it("renders descripcion, tipo label and fecha", () => {
    render(
      <AporteItem
        tipo="donacion"
        descripcion="Donó un proyector"
        fecha="2026-07-12"
        monto={null}
      />,
    );

    expect(screen.getByText("Donó un proyector")).toBeInTheDocument();
    expect(screen.getByText(/Donación/)).toBeInTheDocument();
    expect(screen.getByText(/12 jul 2026/i)).toBeInTheDocument();
  });

  it("omits the amount slot when monto is null (no 0, no USD —)", () => {
    const { container } = render(
      <AporteItem tipo="charla" descripcion="Charla ZK" fecha="2026-07-24" monto={null} />,
    );

    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\b0\b/);
    expect(container.textContent).not.toMatch(/USD/i);
    expect(container.textContent).not.toMatch(/pagar|pago|checkout|wallet/i);
  });

  it("renders monto when present, including legitimate zero", () => {
    const { rerender } = render(
      <AporteItem
        tipo="economico"
        descripcion="Aporte de cuota"
        fecha="2026-07-01"
        monto={15000}
      />,
    );

    expect(screen.getByText(/\$15[.\u00a0]?000/)).toBeInTheDocument();

    rerender(
      <AporteItem tipo="economico" descripcion="Aporte cero" fecha="2026-07-01" monto={0} />,
    );
    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });

  it("uses accented Spanish tipo labels from the enum map", () => {
    render(
      <AporteItem
        tipo="mantenimiento"
        descripcion="Limpió el patio"
        fecha="2026-07-03"
        monto={null}
      />,
    );
    expect(screen.getByText(/Mantenimiento/)).toBeInTheDocument();
  });
});
