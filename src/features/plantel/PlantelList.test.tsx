import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlantelList } from "./PlantelList";
import type { SerranoMember } from "./types";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function member(overrides: Partial<SerranoMember> = {}): SerranoMember {
  return {
    id: "p1",
    name: "Nóbel Dam",
    nombre: "Nóbel",
    apellido: "Dam",
    apodo: null,
    avatarUrl: null,
    tier: "standard",
    disponibilidad: "disponible",
    roles: ["Infra"],
    skills: ["Solidity"],
    ...overrides,
  };
}

const members: SerranoMember[] = [
  member(),
  member({
    id: "p2",
    name: "Ada Lovelace",
    nombre: "Ada",
    apellido: "Lovelace",
    tier: "founder",
    disponibilidad: "ocupado",
    roles: ["Tesorería"],
    skills: ["Diseño"],
  }),
  member({
    id: "p3",
    name: "Alan Turing",
    nombre: "Alan",
    apellido: "Turing",
    apodo: "turing",
    disponibilidad: "solo_eventos",
    roles: ["Charlas"],
    skills: [],
  }),
];

describe("PlantelList", () => {
  it("renders header with total serrano count independent of filters", () => {
    render(<PlantelList members={members} />);
    expect(screen.getByText("Plantel")).toBeInTheDocument();
    expect(screen.getByText("3 serranos en la comunidad")).toBeInTheDocument();
  });

  it("renders the search input with placeholder", () => {
    render(<PlantelList members={members} />);
    expect(screen.getByRole("textbox", { name: "Buscar por nombre o skill" })).toHaveAttribute(
      "placeholder",
      "Buscar por nombre o skill",
    );
  });

  it("filters the list when typing a name", () => {
    render(<PlantelList members={members} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por nombre o skill" }), {
      target: { value: "ada" },
    });
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Nóbel Dam")).not.toBeInTheDocument();
  });

  it("filters by skill name", () => {
    render(<PlantelList members={members} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por nombre o skill" }), {
      target: { value: "solidity" },
    });
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
  });

  it("shows a clear button when the search has a value and clears it", () => {
    render(<PlantelList members={members} />);
    const input = screen.getByRole("textbox", { name: "Buscar por nombre o skill" });
    fireEvent.change(input, { target: { value: "ada" } });
    const clear = screen.getByRole("button", { name: "Limpiar búsqueda" });
    fireEvent.click(clear);
    expect(input).toHaveValue("");
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
  });

  it("Todos chip is active by default", () => {
    render(<PlantelList members={members} />);
    expect(screen.getByRole("button", { name: "Todos" })).toHaveClass("bg-primary");
  });

  it("Disponibles chip toggles the disponibilidad filter", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Disponibles" }));
    expect(screen.getByRole("button", { name: "Disponibles" })).toHaveClass("bg-primary");
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
    expect(screen.queryByText("Alan Turing")).not.toBeInTheDocument();
  });

  it("Por rol opens a picker and selecting a role filters the list", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Nóbel Dam")).not.toBeInTheDocument();
  });

  it("shows the active role on the chip after selecting", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    expect(screen.getByRole("button", { name: "Rol: Tesorería" })).toHaveClass("bg-primary");
  });

  it("clears the role filter when the active option is clicked again", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    expect(screen.getByRole("button", { name: "Rol: Tesorería" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Por rol" })).toBeInTheDocument();
  });

  it("clears the role filter when the active chip is clicked", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    fireEvent.click(screen.getByRole("button", { name: "Rol: Tesorería" }));
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Por rol" })).toBeInTheDocument();
  });

  it("Por skill opens a picker and selecting a skill filters the list", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por skill" }));
    fireEvent.click(screen.getByRole("button", { name: "Diseño" }));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Nóbel Dam")).not.toBeInTheDocument();
  });

  it("shows the active skill on the chip after selecting", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por skill" }));
    fireEvent.click(screen.getByRole("button", { name: "Diseño" }));
    expect(screen.getByRole("button", { name: "Skill: Diseño" })).toHaveClass("bg-primary");
  });

  it("shows an empty state inside the role picker when there are no options", () => {
    render(<PlantelList members={[member({ roles: [], skills: [] })]} roleOptions={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    expect(screen.getByText("Todavía no hay roles cargados")).toBeInTheDocument();
  });

  it("shows an empty state inside the skill picker when there are no options", () => {
    render(<PlantelList members={[member({ roles: [], skills: [] })]} skillOptions={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Por skill" }));
    expect(screen.getByText("Todavía no hay skills cargadas")).toBeInTheDocument();
  });

  it("lists catalog role options even when no member has that role", () => {
    render(
      <PlantelList
        members={[member({ roles: ["Infra"], skills: [] })]}
        roleOptions={["Charlas", "Infra", "RRSS"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    expect(screen.getByRole("button", { name: "Charlas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RRSS" })).toBeInTheDocument();
  });

  it("shows Limpiar filtros while results remain and clears the active role", () => {
    render(<PlantelList members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Por rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Tesorería" }));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Por rol" })).toBeInTheDocument();
  });

  it("shows the empty state with copy and clears everything on Limpiar filtros", () => {
    render(<PlantelList members={members} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por nombre o skill" }), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No encontramos serranos con esos filtros. Probá con otra habilidad o limpiá la búsqueda.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByText("Nóbel Dam")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar por nombre o skill" })).toHaveValue("");
  });

  it("keeps the header count unchanged when filters hide members", () => {
    render(<PlantelList members={members} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por nombre o skill" }), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("3 serranos en la comunidad")).toBeInTheDocument();
  });
});
