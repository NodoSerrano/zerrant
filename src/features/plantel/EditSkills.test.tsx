import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSaveProfileSkills = vi.hoisted(() => vi.fn());

vi.mock("./skills-actions", () => ({
  saveProfileSkills: mockSaveProfileSkills,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import { EditSkills } from "./EditSkills";

const CATALOG = ["Rust", "Solidity", "ZK Proofs", "DevOps"];

function hiddenValues(): string[] {
  return Array.from(document.querySelectorAll('input[type="hidden"][name="skill"]')).map(
    (el) => (el as HTMLInputElement).value,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditSkills", () => {
  it("renders the back link to /profile with an aria-label", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    const back = screen.getByRole("link", { name: "Volver al perfil" });
    expect(back).toHaveAttribute("href", "/profile");
  });

  it("renders the topbar title and Guardar submit button", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "submit");
  });

  it("renders the Pencil header copy", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    expect(screen.getByText("Tus habilidades")).toBeInTheDocument();
    expect(
      screen.getByText("Agregá tags. Te sugerimos los que ya usa la comunidad."),
    ).toBeInTheDocument();
  });

  it("renders the search input with the Pencil placeholder", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    expect(screen.getByRole("textbox", { name: "Agregar habilidad" })).toHaveAttribute(
      "placeholder",
      "Agregar habilidad...",
    );
  });

  it("renders current skills as green removable chips with aria-labels", () => {
    render(<EditSkills initialSkills={["Solidity"]} catalog={CATALOG} />);
    const chip = screen.getByRole("button", { name: "Quitar Solidity" });
    expect(chip.className).toContain("bg-brand-green/10");
  });

  it("renders suggestions excluding the selected skills with aria-labels", () => {
    render(<EditSkills initialSkills={["Solidity"]} catalog={CATALOG} />);
    expect(screen.getByText("Sugerencias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar Rust" }).className).toContain("bg-surface");
    expect(screen.getByRole("button", { name: "Quitar Solidity" }).className).toContain(
      "bg-brand-green/10",
    );
  });

  it("adds a suggestion to the selected skills when clicked", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Rust" }));

    expect(hiddenValues()).toContain("Rust");
    expect(screen.getByRole("button", { name: "Quitar Rust" }).className).toContain(
      "bg-brand-green/10",
    );
  });

  it("removes a selected skill when its chip is clicked", () => {
    render(<EditSkills initialSkills={["Solidity"]} catalog={CATALOG} />);
    fireEvent.click(screen.getByRole("button", { name: "Quitar Solidity" }));

    expect(hiddenValues()).not.toContain("Solidity");
  });

  it("filters suggestions by the typed query", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Agregar habilidad" }), {
      target: { value: "dev" },
    });

    expect(screen.getByRole("button", { name: "Agregar DevOps" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar Rust" })).not.toBeInTheDocument();
  });

  it("carries the selected skills as hidden inputs for submission", () => {
    render(<EditSkills initialSkills={["Solidity", "Rust"]} catalog={CATALOG} />);
    expect(hiddenValues()).toEqual(["Solidity", "Rust"]);
  });

  it("shows an empty state when the whole catalog is selected", () => {
    render(<EditSkills initialSkills={CATALOG} catalog={CATALOG} />);
    expect(screen.getByText("No hay más habilidades para sugerir.")).toBeInTheDocument();
  });

  it("shows the action error when the save fails", async () => {
    mockSaveProfileSkills.mockResolvedValue({ error: "No autorizado" });
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No autorizado"));
  });

  it("prevents the default Enter action in the search field so the form is not submitted", () => {
    render(<EditSkills initialSkills={[]} catalog={CATALOG} />);

    const search = screen.getByRole("textbox", { name: "Agregar habilidad" });
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, "preventDefault");

    search.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });
});
