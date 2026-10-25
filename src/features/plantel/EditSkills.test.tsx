import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  saveProfileSkills: vi.fn(),
  proposeSkill: vi.fn(),
}));

vi.mock("./skills-actions", () => ({
  saveProfileSkills: mocks.saveProfileSkills,
  proposeSkill: mocks.proposeSkill,
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
import type { SkillItem } from "./skills";

const CATALOG = ["Rust", "Solidity", "ZK Proofs", "DevOps"];

function skill(nombre: string, extra: Partial<SkillItem> = {}): SkillItem {
  return { nombre, nivel: null, anios_freelance: null, anios_empresa: null, ...extra };
}

function submitted(): SkillItem[] {
  const input = document.querySelector('input[type="hidden"][name="items"]') as HTMLInputElement;
  return JSON.parse(input.value) as SkillItem[];
}

function renderEdit(opts: { initial?: SkillItem[]; pending?: string[] } = {}) {
  return render(
    <EditSkills
      initialSkills={opts.initial ?? []}
      catalog={CATALOG}
      pendingProposals={opts.pending ?? []}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditSkills", () => {
  it("renders the back link to /profile with an aria-label", () => {
    renderEdit();
    expect(screen.getByRole("link", { name: "Volver al perfil" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("renders the topbar title and Guardar submit button", () => {
    renderEdit();
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "submit");
  });

  it("renders the search input with the Pencil placeholder", () => {
    renderEdit();
    expect(screen.getByRole("textbox", { name: "Agregar habilidad" })).toHaveAttribute(
      "placeholder",
      "Agregar habilidad...",
    );
  });

  it("renders suggestions excluding the selected skills", () => {
    renderEdit({ initial: [skill("Solidity")] });
    expect(screen.getByText("Sugerencias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar Rust" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar Solidity" })).not.toBeInTheDocument();
  });

  it("adds a suggestion to the selected skills when clicked", () => {
    renderEdit();
    fireEvent.click(screen.getByRole("button", { name: "Agregar Rust" }));

    expect(submitted()).toEqual([skill("Rust")]);
    expect(screen.getByRole("button", { name: "Quitar Rust" })).toBeInTheDocument();
  });

  it("removes a selected skill", () => {
    renderEdit({ initial: [skill("Solidity")] });
    fireEvent.click(screen.getByRole("button", { name: "Quitar Solidity" }));

    expect(submitted()).toEqual([]);
  });

  it("filters suggestions by the typed query", () => {
    renderEdit();
    fireEvent.change(screen.getByRole("textbox", { name: "Agregar habilidad" }), {
      target: { value: "dev" },
    });

    expect(screen.getByRole("button", { name: "Agregar DevOps" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar Rust" })).not.toBeInTheDocument();
  });

  it("shows an empty state when the whole catalog is selected", () => {
    renderEdit({ initial: CATALOG.map((name) => skill(name)) });
    expect(screen.getByText("No hay más habilidades para sugerir.")).toBeInTheDocument();
  });

  it("shows the action error when the save fails", async () => {
    mocks.saveProfileSkills.mockResolvedValue({ error: "No autorizado" });
    renderEdit();

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No autorizado"));
  });

  it("prevents the default Enter action in the search field so the form is not submitted", () => {
    renderEdit();
    const search = screen.getByRole("textbox", { name: "Agregar habilidad" });
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, "preventDefault");

    search.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  describe("level and years (ZER-163)", () => {
    it("shows the saved level and years for each skill", () => {
      renderEdit({
        initial: [skill("Solidity", { nivel: "avanzado", anios_freelance: 3, anios_empresa: 2 })],
      });

      expect(screen.getByRole("combobox", { name: "Nivel en Solidity" })).toHaveValue("avanzado");
      expect(screen.getByRole("spinbutton", { name: "Años freelance en Solidity" })).toHaveValue(3);
      expect(screen.getByRole("spinbutton", { name: "Años en empresa en Solidity" })).toHaveValue(
        2,
      );
    });

    it("sends what the member edits, freelance and company years separately", () => {
      renderEdit({ initial: [skill("Rust")] });

      fireEvent.change(screen.getByRole("combobox", { name: "Nivel en Rust" }), {
        target: { value: "intermedio" },
      });
      fireEvent.change(screen.getByRole("spinbutton", { name: "Años freelance en Rust" }), {
        target: { value: "4" },
      });
      fireEvent.change(screen.getByRole("spinbutton", { name: "Años en empresa en Rust" }), {
        target: { value: "1" },
      });

      expect(submitted()).toEqual([
        skill("Rust", { nivel: "intermedio", anios_freelance: 4, anios_empresa: 1 }),
      ]);
    });

    it("keeps level and years optional", () => {
      renderEdit({ initial: [skill("Rust", { nivel: "basico", anios_freelance: 2 })] });

      fireEvent.change(screen.getByRole("combobox", { name: "Nivel en Rust" }), {
        target: { value: "" },
      });
      fireEvent.change(screen.getByRole("spinbutton", { name: "Años freelance en Rust" }), {
        target: { value: "" },
      });

      expect(submitted()).toEqual([skill("Rust")]);
    });

    it("caps years between 0 and 60", () => {
      renderEdit({ initial: [skill("Rust")] });
      const freelance = screen.getByRole("spinbutton", { name: "Años freelance en Rust" });
      expect(freelance).toHaveAttribute("min", "0");
      expect(freelance).toHaveAttribute("max", "60");
    });
  });

  describe("proposals (ZER-163)", () => {
    it("offers to propose a name that is not in the catalog", () => {
      renderEdit();
      fireEvent.change(screen.getByRole("textbox", { name: "Agregar habilidad" }), {
        target: { value: "  Cerámica " },
      });

      const propose = screen.getByRole("button", { name: "Proponer «Cerámica»" });
      expect(propose).toHaveAttribute("type", "submit");
      expect(propose).toHaveAttribute("name", "propuesta");
      expect(propose).toHaveAttribute("value", "Cerámica");
    });

    it("does not offer to propose an existing or pending skill, whatever the case", () => {
      renderEdit({ pending: ["Cerámica"] });
      const search = screen.getByRole("textbox", { name: "Agregar habilidad" });

      fireEvent.change(search, { target: { value: "rust" } });
      expect(screen.queryByRole("button", { name: /Proponer/ })).not.toBeInTheDocument();

      fireEvent.change(search, { target: { value: "cerámica" } });
      expect(screen.queryByRole("button", { name: /Proponer/ })).not.toBeInTheDocument();
    });

    it("lists the member's proposals waiting for an admin", () => {
      renderEdit({ pending: ["Cerámica", "Telar"] });

      expect(screen.getByRole("heading", { name: "Pendientes de aprobación" })).toBeInTheDocument();
      expect(screen.getByText("Cerámica")).toBeInTheDocument();
      expect(screen.getByText("Telar")).toBeInTheDocument();
    });

    it("confirms the proposal was sent", async () => {
      mocks.proposeSkill.mockResolvedValue({
        success: "Propusiste «Cerámica». Un admin la va a revisar.",
      });
      renderEdit();
      fireEvent.change(screen.getByRole("textbox", { name: "Agregar habilidad" }), {
        target: { value: "Cerámica" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Proponer «Cerámica»" }));

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Propusiste «Cerámica»"),
      );
      expect(mocks.saveProfileSkills).not.toHaveBeenCalled();
    });
  });
});
