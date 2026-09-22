import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

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

import { SolicitarForm } from "./SolicitarForm";
import { APORTE_REFERENCIA_PARAGRAPHS } from "@/features/membership/screening";

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
}

function goToStep2() {
  fireEvent.change(screen.getByLabelText(/Teléfono \/ WhatsApp/i), {
    target: { value: "1122334455" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /1 vez por semana/i }));
  fireEvent.click(screen.getByRole("radio", { name: /2–4 horas/i }));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
}

function goToStep3() {
  goToStep2();
  fireEvent.click(screen.getByRole("radio", { name: /Me resulta cómodo/i }));
  fireEvent.change(screen.getByLabelText(/Día\/horario fácil para la reunión/i), {
    target: { value: "Martes 18hs" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([null, mocks.formAction, false]);
  setHistoryLength(2);
});

describe("SolicitarForm — header (AC1)", () => {
  it("renders a 24×24 chevron-left back button in text-primary", () => {
    render(<SolicitarForm />);

    const back = screen.getByRole("button", { name: /volver|cerrar/i });
    const icon = back.querySelector("svg");
    expect(icon).toBeTruthy();
    expect(icon!.classList.contains("size-6")).toBe(true);
    expect(icon!.classList.contains("text-text-primary")).toBe(true);
  });

  it("calls router.back() when the back button is clicked on step 1", () => {
    render(<SolicitarForm />);

    fireEvent.click(screen.getByRole("button", { name: /volver|cerrar/i }));

    expect(mocks.back).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("falls back to /nodo/tasks when there is no history", () => {
    setHistoryLength(1);
    render(<SolicitarForm />);

    fireEvent.click(screen.getByRole("button", { name: /volver|cerrar/i }));

    expect(mocks.push).toHaveBeenCalledWith("/nodo/tasks");
    expect(mocks.back).not.toHaveBeenCalled();
  });

  it("does not submit the form when pressing back (type=button)", () => {
    render(<SolicitarForm />);

    expect(screen.getByRole("button", { name: /volver|cerrar/i })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("SolicitarForm — icon circle", () => {
  it("renders an 84×84 rounded-full container with user-plus icon", () => {
    render(<SolicitarForm />);

    const icon = document.querySelector(".lucide-user-plus");
    expect(icon).toBeTruthy();

    const container = icon?.closest("div");
    expect(container?.className).toContain("size-[84px]");
    expect(container?.className).toContain("rounded-full");
  });

  it("applies a gradient fill matching Pencil (mint→blue at 135deg)", () => {
    render(<SolicitarForm />);

    const container = document.querySelector(".lucide-user-plus")?.closest("div");
    expect(container?.className).toContain("bg-gradient-brand");
  });

  it("renders the user-plus icon at 36×36 in on-primary", () => {
    render(<SolicitarForm />);

    const icon = document.querySelector(".lucide-user-plus");
    expect(icon).toBeTruthy();
    expect(icon!.classList.contains("size-9")).toBe(true);
    expect(icon!.classList.contains("text-on-primary")).toBe(true);
  });
});

describe("SolicitarForm — title and subtitle", () => {
  it('renders "Sumate como Serrano" as the title', () => {
    render(<SolicitarForm />);

    const title = screen.getByText("Sumate como Serrano");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-[24px]");
    expect(title.className).toContain("font-bold");
    expect(title.className).toContain("text-text-primary");
  });

  it("renders the subtitle with body font, 14px, secondary color", () => {
    render(<SolicitarForm />);

    const subtitle = screen.getByText(/Completá estos datos para que un admin revise/);
    expect(subtitle.className).toContain("font-body");
    expect(subtitle.className).toContain("text-[14px]");
    expect(subtitle.className).toContain("text-text-secondary");
  });
});

describe("SolicitarForm — multi-step (ZER-109)", () => {
  it("starts on step 1 and shows Siguiente instead of submit", () => {
    render(<SolicitarForm />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar solicitud" })).toBeNull();
    expect(screen.getByLabelText(/Teléfono \/ WhatsApp/i)).toBeInTheDocument();
  });

  it("blocks step 1 advance when core fields are empty", () => {
    render(<SolicitarForm />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/WhatsApp, frecuencia y duración/i);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });

  it("advances to step 2 and shows the reference aporte guide before attitude", () => {
    render(<SolicitarForm />);
    goToStep2();
    const box = screen.getByTestId("aporte-referencia");
    expect(within(box).getByText("Aporte de referencia")).toBeInTheDocument();
    expect(within(box).getByText(APORTE_REFERENCIA_PARAGRAPHS[0])).toBeInTheDocument();
    expect(within(box).getByText(/\$5\.000 por día/)).toBeInTheDocument();
    expect(within(box).getByText(/\$20\.000 por día/)).toBeInTheDocument();
    expect(within(box).getByText(/Site Manager/)).toBeInTheDocument();
    expect(screen.getByLabelText(/aporte de referencia/i)).toBeInTheDocument();
    expect(screen.getByText(/Aporte y reunión/i)).toBeInTheDocument();
  });

  it("uses exclusive radio choices instead of select elements", () => {
    render(<SolicitarForm />);
    expect(document.querySelectorAll("select").length).toBe(0);
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    goToStep2();
    expect(document.querySelectorAll("select").length).toBe(0);
    expect(screen.getByRole("radio", { name: /Me resulta cómodo/i })).toBeInTheDocument();
  });

  it("goes back from step 2 to step 1 without leaving the page", () => {
    render(<SolicitarForm />);
    goToStep2();
    fireEvent.click(screen.getByRole("button", { name: /volver|cerrar/i }));
    expect(mocks.back).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Teléfono \/ WhatsApp/i)).toBeVisible();
  });

  it("reaches step 3 and shows the final submit CTA", () => {
    render(<SolicitarForm />);
    goToStep3();
    expect(screen.getByRole("button", { name: "Enviar solicitud" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje/i)).toBeInTheDocument();
  });
});

describe("SolicitarForm — required markers (ZER-109)", () => {
  it("shows a coral asterisk next to required choice legends on step 1", () => {
    render(<SolicitarForm />);
    const legend = screen.getByText(/frecuencia pensás venir/i).closest("legend");
    expect(legend?.textContent).toContain("*");
    const star = legend?.querySelector('[aria-hidden="true"]');
    expect(star?.className).toContain("text-coral");
  });

  it("shows a coral asterisk on the required reunión label", () => {
    render(<SolicitarForm />);
    goToStep2();
    const label = screen.getByText(/Día\/horario fácil para la reunión/i).parentElement;
    expect(label?.textContent).toContain("*");
  });
});

describe("SolicitarForm — message textarea", () => {
  it('renders "Mensaje (opcional)" label with 13px medium secondary', () => {
    render(<SolicitarForm />);
    goToStep3();

    const label = screen.getByText(/^Mensaje$/);
    expect(label.className).toContain("text-[13px]");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-text-secondary");
    const wrap = label.parentElement;
    expect(wrap?.textContent).toMatch(/\(opcional\)/);
  });

  it("renders a textarea named 'mensaje' with the Pencil placeholder", () => {
    render(<SolicitarForm />);
    goToStep3();

    const textarea = screen.getByPlaceholderText(/Soy dev, me copa la infra/);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "mensaje");
  });

  it("styles the textarea to match Pencil (110px, rounded-2xl, surface, border, padding 16)", () => {
    render(<SolicitarForm />);
    goToStep3();

    const textarea = screen.getByPlaceholderText(/Soy dev, me copa la infra/);
    expect(textarea.className).toContain("h-[110px]");
    expect(textarea.className).toContain("rounded-2xl");
    expect(textarea.className).toContain("bg-surface");
    expect(textarea.className).toContain("border-border");
    expect(textarea.className).toContain("p-4");
    expect(textarea.className).toContain("text-[15px]");
    expect(textarea.className).toContain("resize-none");
    expect(textarea.className).toContain("placeholder:text-text-muted");
  });
});

describe("SolicitarForm — info box", () => {
  it("renders the info text about admin review", () => {
    render(<SolicitarForm />);
    goToStep3();

    expect(screen.getByText(/Un admin va a revisar tu solicitud/i)).toBeInTheDocument();
    expect(screen.getByText(/coordina(?:r)? la reunión/i)).toBeInTheDocument();
  });

  it("renders the info icon in brand-blue", () => {
    render(<SolicitarForm />);
    goToStep3();

    const infoIcon = document.querySelector(".lucide-info");
    expect(infoIcon).toBeTruthy();
    expect(infoIcon!.classList.contains("text-brand-blue")).toBe(true);
  });

  it("styles the info box with surface-inset background and rounded-2xl", () => {
    render(<SolicitarForm />);
    goToStep3();

    const infoBox = document.querySelector(".lucide-info")?.closest("div");
    expect(infoBox?.className).toContain("bg-surface-inset");
    expect(infoBox?.className).toContain("rounded-2xl");
    expect(infoBox?.className).toContain("p-[14px]");
  });
});

describe("SolicitarForm — CTA and link", () => {
  it('renders a full-width submit button labelled "Enviar solicitud" on the last step', () => {
    render(<SolicitarForm />);
    goToStep3();

    const cta = screen.getByRole("button", { name: "Enviar solicitud" });
    expect(cta).toHaveAttribute("type", "submit");
    expect(cta.className).toContain("w-full");
    expect((cta as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables the CTA and shows "Enviando..." while pending', () => {
    mocks.useActionState.mockReturnValue([null, mocks.formAction, true]);
    render(<SolicitarForm />);
    goToStep3();

    const cta = screen.getByRole("button", { name: "Enviando..." });
    expect((cta as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Enviar solicitud" })).toBeNull();
  });

  it('renders "Ahora no" link with 15px display 500 muted centered', () => {
    render(<SolicitarForm />);

    const link = screen.getByText("Ahora no");
    expect(link.className).toContain("font-display");
    expect(link.className).toContain("text-[15px]");
    expect(link.className).toContain("font-medium");
    expect(link.className).toContain("text-text-muted");
    expect(link.className).toContain("text-center");
  });

  it('links "Ahora no" back using router.back()', () => {
    render(<SolicitarForm />);

    fireEvent.click(screen.getByText("Ahora no"));

    expect(mocks.back).toHaveBeenCalledTimes(1);
  });
});

describe("SolicitarForm — layout", () => {
  it("stacks the content wrapper with gap-5 to match Pencil gap 20", () => {
    const { container } = render(<SolicitarForm />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex-col");
    expect(wrapper?.className).toContain("gap-5");
  });

  it("leaves shell padding to the route layout (no local page padding)", () => {
    const { container } = render(<SolicitarForm />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).not.toMatch(/\bpt-/);
    expect(wrapper?.className).not.toMatch(/\bpx-/);
    expect(wrapper?.className).not.toMatch(/\bpb-/);
  });
});

describe("SolicitarForm — wiring", () => {
  it("wires the form to the action returned by useActionState", () => {
    render(<SolicitarForm />);

    expect(document.querySelector("form")).toHaveAttribute("action");
  });

  it("renders the error returned by the server action on the last step", () => {
    mocks.useActionState.mockReturnValue([
      { error: "Ya tenes una solicitud pendiente" },
      mocks.formAction,
      false,
    ]);
    render(<SolicitarForm />);
    goToStep3();

    expect(screen.getByText("Ya tenes una solicitud pendiente")).toBeInTheDocument();
  });

  it("renders no error banner when the action has not failed", () => {
    render(<SolicitarForm />);

    expect(screen.queryByText(/solicitud pendiente/)).toBeNull();
  });
});

describe("SolicitarForm — screening core (ZER-108/109)", () => {
  it("renders WhatsApp, frequency and duration on step 1", () => {
    render(<SolicitarForm />);
    expect(screen.getByLabelText(/Teléfono \/ WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frecuencia pensás venir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiempo estimás quedarte/i)).toBeInTheDocument();
  });

  it("marks core screening controls as required across steps", () => {
    render(<SolicitarForm />);
    expect(screen.getByLabelText(/Teléfono \/ WhatsApp/i)).toBeRequired();
    // radios: first option of each required group is required
    const freq = screen.getByRole("radio", { name: /1–2 veces al mes/i });
    expect(freq).toBeRequired();
    goToStep2();
    expect(screen.getByRole("radio", { name: /Me resulta cómodo/i })).toBeRequired();
    expect(screen.getByLabelText(/Día\/horario fácil para la reunión/i)).toBeRequired();
  });
});
