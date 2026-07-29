import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./actions", () => ({
  cancelTask: vi.fn(),
}));

// El Link real reenvía cualquier prop al <a>; el mock tiene que hacer lo mismo
// o se pierde el `role` que hace al item accesible.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { TaskMenu } from "./TaskMenu";

beforeEach(() => {
  vi.clearAllMocks();
});

const OWNER_OPEN = { taskId: "task-1", estado: "abierta" as const, isOwner: true };

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Más opciones" }));
}

describe("TaskMenu — visibility (AC6)", () => {
  // Regla production-first: nada de controles muertos. Si no hay acción que
  // ofrecer, el disparador directamente no se dibuja.
  it("renders nothing when the viewer is not the creator", () => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} isOwner={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each(["hecha", "verificada", "cancelada"])("renders nothing when the task is %s", (estado) => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} estado={estado} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each(["abierta", "tomada"])("renders the trigger for the creator when %s", (estado) => {
    render(<TaskMenu {...OWNER_OPEN} estado={estado} />);

    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });

  it("renders the ellipsis icon at the Pencil size", () => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} />);

    const icon = container.querySelector("svg.lucide-ellipsis")!;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute("class")).toContain("size-[22px]");
  });
});

describe("TaskMenu — opening and items (AC6)", () => {
  it("keeps the menu closed until the trigger is pressed", () => {
    render(<TaskMenu {...OWNER_OPEN} />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("offers Editar and Cancelar tarea once open", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancelar tarea" })).toBeInTheDocument();
  });

  it("points Editar at the edit route", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();

    expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveAttribute(
      "href",
      "/nodo/tasks/task-1/edit",
    );
  });

  // En la pantalla de editar, "Editar" sería un no-op sobre la pantalla en la
  // que ya estás; cancelar sigue teniendo sentido y evita volver al detalle.
  it("drops the Editar item when the caller asks for the edit-screen variant", () => {
    render(<TaskMenu {...OWNER_OPEN} showEditItem={false} />);
    openMenu();

    expect(screen.queryByRole("menuitem", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancelar tarea" })).toBeInTheDocument();
  });

  it("dresses the menu surface in design system tokens", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();

    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("bg-surface");
    expect(menu.className).toContain("border-border");
    expect(menu.className).toContain("rounded-md");
    expect(menu.className).toContain("shadow-[0_10px_30px_-12px_rgba(26,22,20,0.15)]");
  });

  it("marks the trigger expanded state for assistive tech", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    const trigger = screen.getByRole("button", { name: "Más opciones" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("TaskMenu — keyboard (AC6)", () => {
  it("closes on Escape and gives focus back to the trigger", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    const trigger = screen.getByRole("button", { name: "Más opciones" });
    fireEvent.click(trigger);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("TaskMenu — cancelling (AC6)", () => {
  // Cancelar no se deshace con un click: la tarea vuelve a un estado del que ya
  // no se puede salir. Se confirma antes de disparar el server action.
  it("does not submit straight away — it asks first", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar tarea" }));

    expect(screen.getByText("¿Cancelar esta tarea?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });

  it("submits the task id when the cancellation is confirmed", () => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar tarea" }));

    const confirm = screen.getByRole("button", { name: "Sí, cancelar" });
    expect(confirm).toHaveAttribute("type", "submit");
    expect(confirm.closest("form")).toBeTruthy();
    expect(container.querySelector('input[name="taskId"]')).toHaveValue("task-1");
  });

  it("backs out of the confirmation without cancelling anything", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar tarea" }));

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(screen.queryByText("¿Cancelar esta tarea?")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancelar tarea" })).toBeInTheDocument();
  });
});
