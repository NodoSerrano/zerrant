import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockConfirmProfileRole = vi.hoisted(() => vi.fn());

vi.mock("@/features/roles/actions", () => ({
  confirmProfileRole: mockConfirmProfileRole,
}));

import { RolesConfirmationPanel } from "@/features/roles/roles-confirmation-panel";

const mockData = [
  {
    profileId: "p1",
    profileName: "Juan Pérez",
    roles: [
      { roleId: "r1", roleName: "Infra" },
      { roleId: "r2", roleName: "RRSS" },
    ],
  },
  {
    profileId: "p2",
    profileName: "María García",
    roles: [{ roleId: "r3", roleName: "Charlas" }],
  },
];

describe("RolesConfirmationPanel", () => {
  it("renders header 'Roles a confirmar'", () => {
    render(<RolesConfirmationPanel data={mockData} />);
    expect(screen.getByText("Roles a confirmar")).toBeInTheDocument();
  });

  it("shows each profile name", () => {
    render(<RolesConfirmationPanel data={mockData} />);
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("María García")).toBeInTheDocument();
  });

  it("shows role names with RoleChip for each unconfirmed role", () => {
    render(<RolesConfirmationPanel data={mockData} />);
    expect(screen.getByText("Infra")).toBeInTheDocument();
    expect(screen.getByText("RRSS")).toBeInTheDocument();
    expect(screen.getByText("Charlas")).toBeInTheDocument();
  });

  it("shows a confirm button for each role", () => {
    render(<RolesConfirmationPanel data={mockData} />);
    const buttons = screen.getAllByRole("button", { name: /Confirmar rol/ });
    expect(buttons).toHaveLength(3);
  });

  it("shows empty state when there are no pending roles", () => {
    render(<RolesConfirmationPanel data={[]} />);
    expect(screen.getByText("No hay roles pendientes de confirmación")).toBeInTheDocument();
  });
});
