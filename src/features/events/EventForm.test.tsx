import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { EventForm } from "./EventForm";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

describe("EventForm", () => {
  it("renders titulo, descripcion, lugar, fecha, inicio and fin controls", () => {
    render(<EventForm action={async () => null} />);

    expect(screen.getByLabelText("Título")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Lugar")).toBeTruthy();
    expect(screen.getByLabelText("Fecha")).toBeTruthy();
    expect(screen.getByLabelText("Inicio")).toBeTruthy();
    expect(screen.getByLabelText("Fin")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publicar evento" })).toBeTruthy();
  });

  it("does not offer draft / publish lifecycle or cancel controls", () => {
    const { container } = render(<EventForm action={async () => null} />);
    const copy = container.textContent?.toLowerCase() ?? "";

    expect(screen.queryByLabelText(/estado/i)).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    for (const banned of ["borrador", "cancelar evento", "estado", "publicar/cancelar"]) {
      expect(copy).not.toContain(banned);
    }
  });

  it("shows a Spanish alert when the action returns an error", () => {
    mocks.useActionState.mockReturnValue([
      { error: "La hora de fin no puede ser anterior al inicio." },
      mocks.formAction,
      false,
    ]);

    render(<EventForm action={async () => null} />);

    expect(screen.getByRole("alert").textContent).toContain(
      "La hora de fin no puede ser anterior al inicio.",
    );
  });
});
