import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  // Keep calendar day labels stable (day 15 ≠ "Hoy") across CI runs.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-20T15:00:00-03:00"));
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
});

afterEach(() => {
  vi.useRealTimers();
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

  it("opens a 24h sheet and does not offer an end before the start", () => {
    render(<EventForm action={async () => null} />);

    fireEvent.click(screen.getByLabelText("Inicio"));
    expect(screen.getByRole("dialog", { name: "Inicio" }).textContent).not.toMatch(/AM|PM/);
    fireEvent.click(screen.getByRole("button", { name: "Hora 19" }));
    fireEvent.click(screen.getByRole("button", { name: "Minuto 00" }));
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    expect(screen.getByLabelText("Inicio")).toHaveValue("19:00");

    fireEvent.click(screen.getByLabelText("Fin"));
    expect(screen.getByRole("button", { name: "Hora 18" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hora 19" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Hora 21" }));
    fireEvent.click(screen.getByRole("button", { name: "Minuto 00" }));
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    expect(screen.getByLabelText("Fin")).toHaveValue("21:00");

    fireEvent.click(screen.getByLabelText("Inicio"));
    fireEvent.click(screen.getByRole("button", { name: "Hora 22" }));
    fireEvent.click(screen.getByRole("button", { name: "Minuto 00" }));
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    expect(screen.getByLabelText("Inicio")).toHaveValue("22:00");
    expect(screen.getByLabelText("Fin")).toHaveValue("22:00");
  });

  it("keeps publish disabled until titulo, fecha, inicio, fin and lugar are filled", () => {
    render(<EventForm action={async () => null} />);
    const publish = screen.getByRole("button", { name: "Publicar evento" });
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Charla" } });
    fireEvent.click(screen.getByLabelText("Fecha"));
    // Today is labeled "Hoy, 15", not "15". Exact name fails on the 15th.
    fireEvent.click(screen.getByRole("button", { name: /^(Hoy, )?15$/ }));
    fireEvent.click(screen.getByLabelText("Inicio"));
    fireEvent.click(screen.getByRole("button", { name: "Hora 18" }));
    fireEvent.click(screen.getByRole("button", { name: "Minuto 30" }));
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    expect(publish).toBeDisabled();
    expect(screen.queryByText(/Dura/)).toBeNull();

    fireEvent.click(screen.getByLabelText("Fin"));
    fireEvent.click(screen.getByRole("button", { name: "Hora 19" }));
    fireEvent.click(screen.getByRole("button", { name: "Minuto 30" }));
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    expect(screen.getByText("Dura 1 h")).toBeTruthy();
    expect(publish).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Lugar"), { target: { value: "Espacio Nodo" } });
    expect(publish).toBeEnabled();
  });

  it("marks today in the date sheet", () => {
    render(<EventForm action={async () => null} />);
    fireEvent.click(screen.getByLabelText("Fecha"));
    expect(screen.getByRole("button", { current: "date" })).toHaveAccessibleName(/Hoy/);
  });
});
