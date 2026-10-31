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

const CATALOG = ["Rust", "Solidity", "ZK Proofs", "DevOps"];

function submitted(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="skill"]'),
  ).map((input) => input.value);
}

function renderEdit(opts: { initial?: string[]; pending?: string[] } = {}) {
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
    renderEdit({ initial: ["Solidity"] });
    expect(screen.getByText("Sugerencias")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar Rust" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar Solidity" })).not.toBeInTheDocument();
  });

  it("adds a suggestion to the selected skills when clicked", () => {
    renderEdit();
    fireEvent.click(screen.getByRole("button", { name: "Agregar Rust" }));

    expect(submitted()).toEqual(["Rust"]);
    expect(screen.getByRole("button", { name: "Quitar Rust" })).toBeInTheDocument();
  });

  it("removes a selected skill", () => {
    renderEdit({ initial: ["Solidity"] });
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
    renderEdit({ initial: CATALOG });
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

  describe("name only (ZER-216)", () => {
    it("sends one hidden skill per selected name", () => {
      renderEdit({ initial: ["Solidity"] });
      fireEvent.click(screen.getByRole("button", { name: "Agregar Rust" }));

      expect(submitted()).toEqual(["Solidity", "Rust"]);
    });

    it("no longer asks for level or years", () => {
      renderEdit({ initial: ["Solidity"] });

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
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
      // React overrides `name` on a button whose formAction is a function (ZER-223).
      expect(propose).not.toHaveAttribute("name");
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
      // The name used to get lost on the way: the action read an empty field (ZER-223).
      const formData = mocks.proposeSkill.mock.calls[0][1] as FormData;
      expect(formData.get("propuesta")).toBe("Cerámica");
    });
  });
});
