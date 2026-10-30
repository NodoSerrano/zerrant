import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: null as { error: string } | null,
  formAction: vi.fn(),
}));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [mocks.state, mocks.formAction, false],
}));

vi.mock("./actions", () => ({
  leaveProject: vi.fn(),
}));

import { LeaveProjectButton } from "./LeaveProjectButton";

beforeEach(() => {
  mocks.state = null;
});

describe("LeaveProjectButton (ZER-200)", () => {
  it("asks for confirmation in a pop up before leaving (ZER-221)", () => {
    render(<LeaveProjectButton projectId="proj-1" />);

    expect(screen.queryByRole("button", { name: "Sí, salir" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salir del proyecto" }));

    expect(screen.getByRole("dialog", { name: "Salir del proyecto" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(screen.getByText(/Vas a dejar de ser parte de este proyecto/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, salir" })).toHaveAttribute("type", "submit");
    expect(document.querySelector('input[name="projectId"]')).toHaveAttribute("value", "proj-1");
  });

  it("can be cancelled with the X", () => {
    render(<LeaveProjectButton projectId="proj-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Salir del proyecto" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("button", { name: "Sí, salir" })).not.toBeInTheDocument();
  });

  it("shows why it could not leave", () => {
    mocks.state = { error: "No pudimos sacarte del proyecto. Probá de nuevo." };
    render(<LeaveProjectButton projectId="proj-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Salir del proyecto" }));

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos sacarte del proyecto");
  });
});
