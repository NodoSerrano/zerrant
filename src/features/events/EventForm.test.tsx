import { fireEvent, render, screen } from "@testing-library/react";
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

  it("keeps description, date, times, and image when the title changes", () => {
    render(
      <EventForm
        action={async () => null}
        defaults={{
          titulo: "Charla",
          descripcion: "Una intro práctica.",
          fecha: "2026-09-20",
          inicio: "19:00",
          fin: "21:00",
          coverUrl: "https://images.lumacdn.com/uploads/cover.png",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Charla nueva" } });

    expect(screen.getByLabelText("Título")).toHaveValue("Charla nueva");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Una intro práctica.");
    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-09-20");
    expect(screen.getByLabelText("Inicio")).toHaveValue("19:00");
    expect(screen.getByLabelText("Fin")).toHaveValue("21:00");
    expect(screen.getByLabelText("Imagen")).toHaveValue(
      "https://images.lumacdn.com/uploads/cover.png",
    );
  });

  it("uses a 24-hour time control so 19:00 does not surface as AM/PM", () => {
    render(<EventForm action={async () => null} defaults={{ inicio: "19:00", fin: "21:00" }} />);

    for (const label of ["Inicio", "Fin"]) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute("type", "time");
      expect(input).toHaveAttribute("lang", "en-GB");
    }
    expect(screen.getByLabelText("Inicio")).toHaveValue("19:00");
    expect(screen.getByLabelText("Fin")).toHaveValue("21:00");
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
