import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// El form usa useActionState, así que lo mockeamos para poder forzar los
// estados `pending` y `error` sin ejecutar el server action de verdad.
const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  formAction: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mocks.useActionState(...args),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mocks.back, push: mocks.push }),
}));

import { NewTaskForm } from "./NewTaskForm";

/** jsdom fija `history.length` en 1; lo pisamos para simular cada caso. */
function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
  setHistoryLength(2);
});

function radio(name: string) {
  return screen.getByRole("radio", { name }) as HTMLInputElement;
}

describe("NewTaskForm — header (AC1)", () => {
  it("renders the title 'Nueva tarea' with Pencil typography", () => {
    render(<NewTaskForm />);

    const title = screen.getByText("Nueva tarea");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-base");
    expect(title.className).toContain("font-medium");
    expect(title.className).toContain("text-text-primary");
  });

  it("lays the header out as a space-between row", () => {
    render(<NewTaskForm />);

    const header = screen.getByText("Nueva tarea").parentElement;
    expect(header?.className).toContain("flex");
    expect(header?.className).toContain("items-center");
    expect(header?.className).toContain("justify-between");
  });

  it("renders a 24×24 close icon in text-text-primary", () => {
    render(<NewTaskForm />);

    const close = screen.getByRole("button", { name: "Cerrar" });
    const icon = close.querySelector("svg");
    expect(icon).toBeTruthy();
    expect(icon!.classList.contains("size-6")).toBe(true);
    expect(icon!.classList.contains("text-text-primary")).toBe(true);
  });

  it("calls router.back() when the close button is clicked", () => {
    render(<NewTaskForm />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(mocks.back).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("falls back to /nodo/tasks when there is no history to go back to", () => {
    // Deep link, atajo de la PWA, pestaña nueva o recarga: esta pantalla es la
    // primera entrada del historial y `back()` no tiene a dónde volver.
    setHistoryLength(1);
    render(<NewTaskForm />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(mocks.push).toHaveBeenCalledWith("/nodo/tasks");
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("does not submit the form when closing", () => {
    render(<NewTaskForm />);

    // Un <button> sin type dentro de un <form> envía el form. Debe ser type="button".
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveAttribute("type", "button");
  });
});

describe("NewTaskForm — layout (AC1, AC2)", () => {
  it("stacks the page with gap-[18px]", () => {
    const { container } = render(<NewTaskForm />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex-col");
    expect(wrapper?.className).toContain("gap-[18px]");
  });

  it("stacks the form fields with gap-4", () => {
    render(<NewTaskForm />);

    // Los campos viven en su propio contenedor: en Pencil `MWvoK` (gap 16) es un
    // hermano del CTA, no su padre.
    const fields = screen.getByLabelText("Título").closest("form")?.firstElementChild;
    expect(fields?.className).toContain("flex-col");
    expect(fields?.className).toContain("gap-4");
  });

  it("separates the CTA from the fields by 18px, not 16px", () => {
    render(<NewTaskForm />);

    // El CTA es hermano del grupo de campos dentro del wrapper `gap: 18` de
    // Pencil. Si el botón cuelga del contenedor de campos hereda gap-4 y queda
    // 2px corto.
    const form = document.querySelector("form");
    expect(form?.className).toContain("flex-col");
    expect(form?.className).toContain("gap-[18px]");

    const cta = screen.getByRole("button", { name: "Publicar tarea" });
    expect(cta.parentElement).toBe(form);
  });
});

describe("NewTaskForm — Título (AC2)", () => {
  it("renders a required text input named 'titulo' with the Pencil placeholder", () => {
    render(<NewTaskForm />);

    const input = screen.getByLabelText("Título") as HTMLInputElement;
    expect(input).toHaveAttribute("name", "titulo");
    expect(input).toHaveAttribute("placeholder", "Ej: Reparar el caño del baño");
    expect(input.required).toBe(true);
  });
});

describe("NewTaskForm — Descripción (AC3)", () => {
  it("renders a textarea named 'descripcion' with the Pencil placeholder", () => {
    render(<NewTaskForm />);

    const textarea = screen.getByLabelText("Descripción") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "descripcion");
    expect(textarea).toHaveAttribute("placeholder", "¿Qué hay que hacer y dónde?");
  });

  it("styles the textarea to match Pencil frame O59irA", () => {
    render(<NewTaskForm />);

    const textarea = screen.getByLabelText("Descripción");
    expect(textarea.className).toContain("h-[84px]");
    expect(textarea.className).toContain("rounded-2xl");
    expect(textarea.className).toContain("bg-surface");
    expect(textarea.className).toContain("border-border");
    expect(textarea.className).toContain("p-4");
    expect(textarea.className).toContain("text-[15px]");
    expect(textarea.className).toContain("leading-[1.4]");
    expect(textarea.className).toContain("placeholder:text-text-muted");
    expect(textarea.className).toContain("resize-none");
  });

  it("labels the description group with 13px medium secondary text", () => {
    render(<NewTaskForm />);

    const label = screen.getByText("Descripción");
    expect(label.className).toContain("text-[13px]");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-text-secondary");
  });
});

describe("NewTaskForm — Categoría (AC4)", () => {
  const CATEGORIAS = [
    ["Reparación", "reparacion"],
    ["Limpieza", "limpieza"],
    ["Compra", "compra"],
    ["Mantenimiento", "mantenimiento"],
    ["Otro", "otro"],
  ];

  it("renders the group label", () => {
    render(<NewTaskForm />);

    const label = screen.getByText("Categoría");
    expect(label.className).toContain("text-[13px]");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-text-secondary");
  });

  it("renders exactly the five Pencil options as a radio group named 'categoria'", () => {
    render(<NewTaskForm />);

    for (const [label, value] of CATEGORIAS) {
      const input = radio(label);
      expect(input).toHaveAttribute("name", "categoria");
      expect(input.value).toBe(value);
    }

    const all = screen.getAllByRole("radio").filter((r) => r.getAttribute("name") === "categoria");
    expect(all).toHaveLength(5);
  });

  it("preselects 'Reparación' to match Pencil", () => {
    render(<NewTaskForm />);

    expect(radio("Reparación").checked).toBe(true);
    expect(radio("Limpieza").checked).toBe(false);
  });

  it("styles each option as a Pencil pill (rounded-pill, px-[14px] py-2, display 13/500)", () => {
    render(<NewTaskForm />);

    const pill = radio("Limpieza").closest("label");
    expect(pill?.className).toContain("rounded-pill");
    expect(pill?.className).toContain("px-[14px]");
    expect(pill?.className).toContain("py-2");
    expect(pill?.className).toContain("font-display");
    expect(pill?.className).toContain("text-[13px]");
    expect(pill?.className).toContain("font-medium");
  });

  it("gives the unselected pill surface+border and the selected pill primary", () => {
    render(<NewTaskForm />);

    const pill = radio("Limpieza").closest("label");
    expect(pill?.className).toContain("bg-surface");
    expect(pill?.className).toContain("border-border");
    expect(pill?.className).toContain("text-text-secondary");
    // Pencil quita el stroke en el seleccionado; usamos border-primary para que
    // coincida con el fondo y no haya salto de layout.
    expect(pill?.className).toContain("has-checked:bg-primary");
    expect(pill?.className).toContain("has-checked:text-on-primary");
    expect(pill?.className).toContain("has-checked:border-primary");
  });

  it("wraps the pills so they break into the Pencil 3+2 rows", () => {
    render(<NewTaskForm />);

    const row = radio("Reparación").closest("label")?.parentElement;
    expect(row?.className).toContain("flex-wrap");
    expect(row?.className).toContain("gap-2");
  });

  it("lets the user pick another category", () => {
    render(<NewTaskForm />);

    fireEvent.click(radio("Compra"));

    expect(radio("Compra").checked).toBe(true);
    expect(radio("Reparación").checked).toBe(false);
  });
});

describe("NewTaskForm — Urgencia (AC5)", () => {
  const URGENCIAS = [
    ["Baja", "baja"],
    ["Media", "media"],
    ["Alta", "alta"],
  ];

  it("renders the group label", () => {
    render(<NewTaskForm />);

    const label = screen.getByText("Urgencia");
    expect(label.className).toContain("text-[13px]");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-text-secondary");
  });

  it("renders three segments as a radio group named 'urgencia'", () => {
    render(<NewTaskForm />);

    for (const [label, value] of URGENCIAS) {
      const input = radio(label);
      expect(input).toHaveAttribute("name", "urgencia");
      expect(input.value).toBe(value);
    }

    const all = screen.getAllByRole("radio").filter((r) => r.getAttribute("name") === "urgencia");
    expect(all).toHaveLength(3);
  });

  it("preselects 'Media' to match Pencil", () => {
    render(<NewTaskForm />);

    expect(radio("Media").checked).toBe(true);
    expect(radio("Baja").checked).toBe(false);
    expect(radio("Alta").checked).toBe(false);
  });

  it("styles the track to match Pencil frame jmLgk", () => {
    render(<NewTaskForm />);

    const track = radio("Baja").closest("label")?.parentElement;
    expect(track?.className).toContain("rounded-2xl");
    expect(track?.className).toContain("bg-surface-inset");
    expect(track?.className).toContain("p-1");
    expect(track?.className).toContain("gap-1");
  });

  it("styles each segment to match Pencil", () => {
    render(<NewTaskForm />);

    const segment = radio("Baja").closest("label");
    expect(segment?.className).toContain("flex-1");
    expect(segment?.className).toContain("h-[38px]");
    expect(segment?.className).toContain("rounded-xl");
    expect(segment?.className).toContain("font-display");
    expect(segment?.className).toContain("text-[13px]");
    expect(segment?.className).toContain("font-medium");
    expect(segment?.className).toContain("text-text-muted");
    expect(segment?.className).toContain("has-checked:bg-primary");
    expect(segment?.className).toContain("has-checked:text-on-primary");
  });

  it("lets the user pick another urgency", () => {
    render(<NewTaskForm />);

    fireEvent.click(radio("Alta"));

    expect(radio("Alta").checked).toBe(true);
    expect(radio("Media").checked).toBe(false);
  });
});

describe("NewTaskForm — CTA (AC6)", () => {
  it("renders a full-width submit button labelled 'Publicar tarea'", () => {
    render(<NewTaskForm />);

    const cta = screen.getByRole("button", { name: "Publicar tarea" });
    expect(cta).toHaveAttribute("type", "submit");
    expect(cta.className).toContain("w-full");
    expect((cta as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables the CTA and shows 'Publicando...' while pending", () => {
    mocks.useActionState.mockReturnValue([null, mocks.formAction, true]);
    render(<NewTaskForm />);

    const cta = screen.getByRole("button", { name: "Publicando..." });
    expect((cta as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Publicar tarea" })).toBeNull();
  });

  it("has no Cancelar button — Pencil exits via the header x", () => {
    render(<NewTaskForm />);

    expect(screen.queryByText("Cancelar")).toBeNull();
  });
});

describe("NewTaskForm — wiring (AC8)", () => {
  it("wires the form to the action returned by useActionState", () => {
    render(<NewTaskForm />);

    expect(document.querySelector("form")).toHaveAttribute("action");
  });

  it("renders the error returned by the server action", () => {
    mocks.useActionState.mockReturnValue([
      { error: "Solo los serranos pueden crear tareas" },
      mocks.formAction,
      false,
    ]);
    render(<NewTaskForm />);

    expect(screen.getByText("Solo los serranos pueden crear tareas")).toBeInTheDocument();
  });

  it("renders no error banner when the action has not failed", () => {
    render(<NewTaskForm />);

    expect(screen.queryByText(/Solo los serranos/)).toBeNull();
  });
});
