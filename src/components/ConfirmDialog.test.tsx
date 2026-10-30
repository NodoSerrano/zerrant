import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const props: React.ComponentProps<typeof ConfirmDialog> = {
    title: "Quitar admin",
    confirmLabel: "Sí, quitar",
    pendingLabel: "Quitando...",
    action: vi.fn(),
    pending: false,
    onCancel: vi.fn(),
    hiddenFields: { projectId: "proj-1", profileId: "user-2" },
    children: "¿Quitarle el rol de admin a Ana?",
    ...overrides,
  };
  render(
    <>
      <button type="button">trigger</button>
      <ConfirmDialog {...props} />
    </>,
  );
  return props;
}

describe("ConfirmDialog (ZER-221)", () => {
  it("is a modal dialog named by its title, with the message and a single confirm button", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Quitar admin" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("¿Quitarle el rol de admin a Ana?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, quitar" })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("button", { name: "Volver" })).not.toBeInTheDocument();
  });

  it("posts the hidden fields with the form", () => {
    renderDialog();

    const form = screen.getByRole("dialog").closest("form") ?? screen.getByRole("dialog");
    const data = new FormData(form as HTMLFormElement);
    expect(data.get("projectId")).toBe("proj-1");
    expect(data.get("profileId")).toBe("user-2");
  });

  it("moves focus into the dialog, on the cancel X", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("cancels with the X", () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels when tapping outside, not when tapping inside", () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("dialog"));
    expect(props.onCancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("confirm-dialog-backdrop"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels with Escape", () => {
    const props = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cannot be cancelled while the action is in flight", () => {
    const props = renderDialog({ pending: true });

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByTestId("confirm-dialog-backdrop"));
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("shows the pending label and disables confirm while in flight", () => {
    renderDialog({ pending: true });
    expect(screen.getByRole("button", { name: "Quitando..." })).toBeDisabled();
  });

  it("announces the action error", () => {
    renderDialog({ error: "El proyecto necesita al menos un admin." });
    expect(screen.getByRole("alert")).toHaveTextContent("El proyecto necesita al menos un admin.");
  });

  it("returns focus to what had it before opening, when it closes", () => {
    const { rerender } = render(<button type="button">trigger</button>);
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();

    const props = {
      title: "Salir del proyecto",
      confirmLabel: "Sí, salir",
      pendingLabel: "Saliendo...",
      action: vi.fn(),
      pending: false,
      onCancel: vi.fn(),
      children: "Vas a dejar de ser parte de este proyecto.",
    };
    rerender(
      <>
        <button type="button">trigger</button>
        <ConfirmDialog {...props} />
      </>,
    );
    expect(trigger).not.toHaveFocus();

    rerender(<button type="button">trigger</button>);
    expect(trigger).toHaveFocus();
  });
});
