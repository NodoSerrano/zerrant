import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mocks.useActionState(...args),
  };
});

import { AporteForm } from "./AporteForm";
import { APORTE_TIPO_OPTIONS } from "./types";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

describe("AporteForm", () => {
  it("renders tipo, descripcion, fecha and optional monto controls", () => {
    render(<AporteForm action={async () => null} isPlatformAdmin={false} />);

    expect(screen.getByText("Tipo de aporte")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Fecha")).toBeTruthy();
    expect(screen.getByLabelText(/Monto \(opcional/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrar aporte" })).toBeTruthy();
  });

  it("offers exactly nine unaccented tipo values with Spanish labels", () => {
    render(<AporteForm action={async () => null} isPlatformAdmin={false} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(9);
    expect(radios.map((r) => (r as HTMLInputElement).value).sort()).toEqual(
      [...APORTE_TIPO_OPTIONS.map((o) => o.value)].sort(),
    );
    for (const option of APORTE_TIPO_OPTIONS) {
      expect(screen.getByRole("radio", { name: option.label })).toBeTruthy();
    }
  });

  it("hides the admin profile_id control for non-admins", () => {
    render(<AporteForm action={async () => null} isPlatformAdmin={false} />);

    expect(screen.queryByLabelText(/Registrar para otro/i)).toBeNull();
    expect(screen.queryByLabelText(/ID de perfil/i)).toBeNull();
  });

  it("shows the admin profile_id control for platform admins", () => {
    render(<AporteForm action={async () => null} isPlatformAdmin />);

    expect(screen.getByLabelText(/ID de perfil \(otro serrano\)/i)).toBeTruthy();
  });

  it("contains no payment, checkout or pagar affordance", () => {
    const { container } = render(<AporteForm action={async () => null} isPlatformAdmin={false} />);

    const copy = container.textContent?.toLowerCase() ?? "";
    for (const banned of ["pagar", "cobrar", "checkout", "wallet", "precio"]) {
      expect(copy).not.toContain(banned);
    }
  });
});
