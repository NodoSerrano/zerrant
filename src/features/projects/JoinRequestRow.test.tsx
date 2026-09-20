import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JoinRequestRow } from "./JoinRequestRow";

vi.mock("@/lib/use-guarded-action-state", () => ({
  useGuardedActionState: () => [null, vi.fn(), false],
}));

vi.mock("@/features/projects/actions", () => ({
  approveProjectJoin: vi.fn(),
  rejectProjectJoin: vi.fn(),
}));

vi.mock("@/components/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid={`avatar-${name}`}>{name}</div>,
}));

describe("JoinRequestRow", () => {
  it("renders requester name and approve/reject affordances", () => {
    render(
      <JoinRequestRow
        projectId="proj-1"
        request={{
          profileId: "u2",
          name: "Martín Paz",
          avatarUrl: null,
          subtitle: null,
          createdAt: null,
        }}
      />,
    );

    expect(screen.getAllByText("Martín Paz").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
    expect(screen.getByText("Quiere unirse")).toBeInTheDocument();
  });
});
