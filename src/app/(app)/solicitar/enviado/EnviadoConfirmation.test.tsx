import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnviadoConfirmation } from "./EnviadoConfirmation";

describe("EnviadoConfirmation — Pencil D1hKT", () => {
  it("renders the title and subtitle from Pencil", () => {
    render(<EnviadoConfirmation />);

    const title = screen.getByRole("heading", { name: "¡Solicitud enviada!" });
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-[22px]");
    expect(title.className).toContain("font-bold");
    expect(title.className).toContain("text-text-primary");

    const subtitle = screen.getByText(
      "Un admin va a revisar tu pedido. Te avisamos cuando te aprueben como Serrano.",
    );
    expect(subtitle.className).toContain("font-body");
    expect(subtitle.className).toContain("text-[14px]");
    expect(subtitle.className).toContain("text-text-secondary");
    expect(subtitle.className).toContain("leading-[1.5]");
    expect(subtitle.className).toContain("text-center");
  });

  it("renders a 104×104 mint→green circle with a 48×48 check icon", () => {
    render(<EnviadoConfirmation />);

    const icon = document.querySelector(".lucide-check");
    expect(icon).toBeTruthy();
    expect(icon!.classList.contains("size-12")).toBe(true);
    expect(icon!.classList.contains("text-on-primary")).toBe(true);

    const circle = icon!.closest("div");
    expect(circle?.className).toContain("size-[104px]");
    expect(circle?.className).toContain("rounded-full");
    expect(circle?.className).toContain("from-brand-mint");
    expect(circle?.className).toContain("to-brand-green");
  });

  it('links "Volver al inicio" to / as a primary CTA', () => {
    render(<EnviadoConfirmation />);

    const cta = screen.getByRole("link", { name: "Volver al inicio" });
    expect(cta).toHaveAttribute("href", "/");
    expect(cta.className).toContain("rounded-pill");
    expect(cta.className).toContain("h-[54px]");
    expect(cta.className).toContain("w-full");
    expect(cta.className).toContain("font-display");
    expect(cta.className).toContain("text-[16px]");
    expect(cta.tagName).toBe("A");
  });

  it("uses the Pencil wrapper padding and gap", () => {
    const { container } = render(<EnviadoConfirmation />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("flex-col");
    expect(wrapper?.className).toContain("items-center");
    expect(wrapper?.className).toContain("justify-center");
    expect(wrapper?.className).toContain("gap-5");
    expect(wrapper?.className).toContain("pt-2");
    expect(wrapper?.className).toContain("px-7");
    expect(wrapper?.className).toContain("pb-7");
  });
});
