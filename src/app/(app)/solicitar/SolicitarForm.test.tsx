import { render, screen, fireEvent } from "@testing-library/react";
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

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { value: length, configurable: true });
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

  it("calls router.back() when the back button is clicked", () => {
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
    expect(container?.className).toContain("from-brand-mint");
    expect(container?.className).toContain("to-brand-blue");
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

    const subtitle = screen.getByText(/Contanos por qué querés ser parte/);
    expect(subtitle.className).toContain("font-body");
    expect(subtitle.className).toContain("text-[14px]");
    expect(subtitle.className).toContain("text-text-secondary");
  });
});

describe("SolicitarForm — message textarea", () => {
  it('renders "Mensaje (opcional)" label with 13px medium secondary', () => {
    render(<SolicitarForm />);

    const label = screen.getByText(/Mensaje \(opcional\)/);
    expect(label.className).toContain("text-[13px]");
    expect(label.className).toContain("font-medium");
    expect(label.className).toContain("text-text-secondary");
  });

  it("renders a textarea named 'mensaje' with the Pencil placeholder", () => {
    render(<SolicitarForm />);

    const textarea = screen.getByPlaceholderText(/Soy dev, me copa la infra/);
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "mensaje");
  });

  it("styles the textarea to match Pencil (110px, rounded-2xl, surface, border, padding 16)", () => {
    render(<SolicitarForm />);

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

    expect(screen.getByText(/Un admin va a revisar tu solicitud/)).toBeInTheDocument();
  });

  it("renders the info icon in brand-blue", () => {
    render(<SolicitarForm />);

    const infoIcon = document.querySelector(".lucide-info");
    expect(infoIcon).toBeTruthy();
    expect(infoIcon!.classList.contains("text-brand-blue")).toBe(true);
  });

  it("styles the info box with surface-inset background and rounded-2xl", () => {
    render(<SolicitarForm />);

    const infoBox = document.querySelector(".lucide-info")?.closest("div");
    expect(infoBox?.className).toContain("bg-surface-inset");
    expect(infoBox?.className).toContain("rounded-2xl");
    expect(infoBox?.className).toContain("p-[14px]");
  });
});

describe("SolicitarForm — CTA and link", () => {
  it('renders a full-width submit button labelled "Enviar solicitud"', () => {
    render(<SolicitarForm />);

    const cta = screen.getByRole("button", { name: "Enviar solicitud" });
    expect(cta).toHaveAttribute("type", "submit");
    expect(cta.className).toContain("w-full");
    expect((cta as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables the CTA and shows "Enviando..." while pending', () => {
    mocks.useActionState.mockReturnValue([null, mocks.formAction, true]);
    render(<SolicitarForm />);

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

  it("has the Pencil padding of 6/24/24/24", () => {
    const { container } = render(<SolicitarForm />);

    const wrapper = container.firstElementChild;
    // pt-1.5 = 6px, px-6 = 24px, pb-6 = 24px
    expect(wrapper?.className).toContain("pt-1.5");
    expect(wrapper?.className).toContain("px-6");
    expect(wrapper?.className).toContain("pb-6");
  });
});

describe("SolicitarForm — wiring", () => {
  it("wires the form to the action returned by useActionState", () => {
    render(<SolicitarForm />);

    expect(document.querySelector("form")).toHaveAttribute("action");
  });

  it("renders the error returned by the server action", () => {
    mocks.useActionState.mockReturnValue([
      { error: "Ya tenes una solicitud pendiente" },
      mocks.formAction,
      false,
    ]);
    render(<SolicitarForm />);

    expect(screen.getByText("Ya tenes una solicitud pendiente")).toBeInTheDocument();
  });

  it("renders no error banner when the action has not failed", () => {
    render(<SolicitarForm />);

    expect(screen.queryByText(/solicitud pendiente/)).toBeNull();
  });
});
