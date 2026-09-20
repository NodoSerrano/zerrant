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

import { ProjectForm } from "./ProjectForm";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

function radio(name: string) {
  return screen.getByRole("radio", { name }) as HTMLInputElement;
}

describe("ProjectForm — frame 4.4 fields", () => {
  it("renders nombre, descripcion, estado and ingreso controls with Pencil copy", () => {
    render(
      <ProjectForm
        action={async () => null}
        submitLabel="Crear proyecto"
        pendingLabel="Creando..."
      />,
    );

    expect(screen.getByLabelText("Nombre")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ej: Sitio web de Nodo")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByPlaceholderText("¿De qué se trata? ¿Qué buscás?")).toBeTruthy();
    expect(screen.getByText("Estado")).toBeTruthy();
    expect(screen.getByText("¿Quién puede unirse?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Crear proyecto" })).toBeTruthy();
  });

  it("exposes the four project estado values as radios", () => {
    render(
      <ProjectForm
        action={async () => null}
        submitLabel="Crear proyecto"
        pendingLabel="Creando..."
      />,
    );

    expect(radio("Idea").value).toBe("idea");
    expect(radio("En curso").value).toBe("en_curso");
    expect(radio("Pausado").value).toBe("pausado");
    expect(radio("Terminado").value).toBe("terminado");
    expect(radio("Idea").defaultChecked || radio("Idea").checked).toBe(true);
  });

  it("exposes ingreso options with unaccented stored values and frame labels", () => {
    render(
      <ProjectForm
        action={async () => null}
        submitLabel="Crear proyecto"
        pendingLabel="Creando..."
      />,
    );

    expect(radio("Abierto").value).toBe("abierto");
    expect(radio("Por aprobación").value).toBe("aprobacion");
    expect(screen.getByText("Cualquier serrano se une al toque")).toBeTruthy();
    expect(screen.getByText("Vos aprobás cada ingreso")).toBeTruthy();
    expect(radio("Por aprobación").defaultChecked || radio("Por aprobación").checked).toBe(true);
  });

  it("shows a Spanish alert when the action returns an error", () => {
    mocks.useActionState.mockReturnValue([
      { error: "El nombre no puede estar vacío" },
      mocks.formAction,
      false,
    ]);

    render(
      <ProjectForm
        action={async () => null}
        submitLabel="Crear proyecto"
        pendingLabel="Creando..."
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe("El nombre no puede estar vacío");
  });
});
