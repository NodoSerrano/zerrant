import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./actions", () => ({
  cancelTask: vi.fn(),
}));

// The real Link forwards any prop to the <a>; the mock must do the same
// or the `role` that makes the item accessible is lost.
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
  // Production-first rule: no dead controls. If there is no action to
  // offer, the trigger simply isn't drawn.
  it("renders nothing when the viewer is not the creator", () => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} isOwner={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each(["hecha", "verificada", "cancelada"])("renders nothing when the task is %s", (estado) => {
    const { container } = render(<TaskMenu {...OWNER_OPEN} estado={estado} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not offer Editar once the task is taken — that would change the deal under the taker", () => {
    render(<TaskMenu {...OWNER_OPEN} estado="tomada" />);
    openMenu();

    expect(screen.queryByRole("menuitem", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cancelar tarea" })).toBeInTheDocument();
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

  // On the edit screen, "Editar" would be a no-op on the screen you are
  // already on; cancelling still makes sense and avoids going back to the detail.
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

describe("TaskMenu — dismissal and focus (AC6)", () => {
  it("closes when the pointer goes down outside the menu", () => {
    render(
      <div>
        <TaskMenu {...OWNER_OPEN} />
        <button type="button">Otra cosa</button>
      </div>,
    );
    openMenu();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Otra cosa" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  // If focus stayed on the trigger, the next Tab would go to the content
  // behind instead of the first item of the open menu.
  it("moves focus into the menu when it opens", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();

    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Editar" }));
  });

  // During confirmation there are no `menuitem`s left: keeping `role="menu"`
  // would put a screen reader in an empty menu with a destructive action
  // pending.
  it("stops claiming to be a menu while it is asking for confirmation", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar tarea" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Confirmar cancelación" })).toBeInTheDocument();
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
  // Cancelling isn't undone with a click: the task goes to a state there is
  // no way out of. It asks for confirmation before firing the server action.
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

  // Measured in the browser: with the menu at 180px the two buttons didn't fit
  // and "Sí, cancelar" wrapped onto two lines. No class-based test caught it.
  it("keeps the confirmation labels on a single line", () => {
    render(<TaskMenu {...OWNER_OPEN} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar tarea" }));

    expect(screen.getByRole("button", { name: "Sí, cancelar" }).className).toContain(
      "whitespace-nowrap",
    );
    expect(screen.getByRole("button", { name: "Volver" }).className).toContain("whitespace-nowrap");
    expect(screen.getByRole("dialog").className).toContain("w-max");
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
