import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MisAportesScreen } from "./MisAportesScreen";

describe("MisAportesScreen — Pencil WKoCd", () => {
  it("renders the title and back link to /profile", () => {
    render(<MisAportesScreen total={0} thisMonth={0} />);

    expect(screen.getByRole("heading", { name: "Mis aportes" })).toBeInTheDocument();
    const back = screen.getByRole("link", { name: "Volver al perfil" });
    expect(back).toHaveAttribute("href", "/profile");
  });

  it("shows 0/0 stats with Pencil labels when empty", () => {
    render(<MisAportesScreen total={0} thisMonth={0} />);

    expect(screen.getByText("0", { selector: ".text-text-primary" })).toBeInTheDocument();
    expect(screen.getByText("aportes en total")).toBeInTheDocument();
    expect(screen.getByText("0", { selector: ".text-brand-green" })).toBeInTheDocument();
    expect(screen.getByText("este mes")).toBeInTheDocument();
  });

  it("shows empty copy and no fake list rows", () => {
    render(<MisAportesScreen total={0} thisMonth={0} />);

    expect(screen.getByText("Todavía no hay aportes.")).toBeInTheDocument();
    expect(screen.queryByText("Donó un proyector")).toBeNull();
    expect(screen.queryByText("Charla: Intro a ZK Proofs")).toBeNull();
  });

  it("uses Pencil wrapper padding and stats card tokens", () => {
    const { container } = render(<MisAportesScreen total={0} thisMonth={0} />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("gap-4");
    expect(wrapper?.className).toContain("pt-1.5");
    expect(wrapper?.className).toContain("px-5");
    expect(wrapper?.className).toContain("pb-6");

    const stats = screen.getByTestId("aportes-stats");
    expect(stats.className).toContain("rounded-[20px]");
    expect(stats.className).toContain("bg-surface-inset");
    expect(stats.className).toContain("p-4");
  });
});
