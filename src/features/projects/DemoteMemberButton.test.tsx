import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: null as { error: string } | null,
  pending: false,
  formAction: vi.fn(),
}));

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [mocks.state, mocks.formAction, mocks.pending],
}));

vi.mock("./actions", () => ({
  demoteProjectMember: vi.fn(),
}));

import { DemoteMemberButton } from "./DemoteMemberButton";

beforeEach(() => {
  mocks.state = null;
  mocks.pending = false;
});

describe("DemoteMemberButton (ZER-199)", () => {
  it("asks for confirmation before removing the admin role", () => {
    const { container } = render(
      <DemoteMemberButton projectId="proj-1" profileId="member-2" name="Lucía Morales" />,
    );

    expect(screen.queryByRole("button", { name: "Sí, quitar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar admin" }));

    expect(screen.getByText("¿Quitarle el rol de admin a Lucía Morales?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, quitar" })).toHaveAttribute("type", "submit");
    expect(container.querySelector('input[name="projectId"]')).toHaveAttribute("value", "proj-1");
    expect(container.querySelector('input[name="profileId"]')).toHaveAttribute("value", "member-2");
  });

  it("can be cancelled", () => {
    render(<DemoteMemberButton projectId="proj-1" profileId="member-2" name="Lucía Morales" />);

    fireEvent.click(screen.getByRole("button", { name: "Quitar admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("button", { name: "Sí, quitar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar admin" })).toBeInTheDocument();
  });

  it("shows why it could not remove the role", () => {
    mocks.state = {
      error: "El proyecto necesita al menos un admin. Designá a otra persona antes.",
    };
    render(<DemoteMemberButton projectId="proj-1" profileId="member-2" name="Lucía Morales" />);

    expect(screen.getByRole("alert")).toHaveTextContent("El proyecto necesita al menos un admin");
  });
});
