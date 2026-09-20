import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JoinRequestQueue } from "./JoinRequestQueue";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/projects/JoinRequestRow", () => ({
  JoinRequestRow: ({ request }: { request: { name: string } }) => (
    <div data-testid="join-row">{request.name}</div>
  ),
}));

describe("JoinRequestQueue", () => {
  it("renders one row per pending request with both affordances via rows", () => {
    render(
      <JoinRequestQueue
        projectId="proj-1"
        projectName="Sitio web de Nodo"
        requests={[
          {
            profileId: "u2",
            name: "Martín Paz",
            avatarUrl: null,
            subtitle: null,
            createdAt: null,
          },
          {
            profileId: "u3",
            name: "Sofía Vega",
            avatarUrl: null,
            subtitle: null,
            createdAt: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Sitio web de Nodo" })).toBeInTheDocument();
    expect(screen.getByText("2 pedidos para unirse al proyecto")).toBeInTheDocument();
    expect(screen.getByText("Martín Paz")).toBeInTheDocument();
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al proyecto" })).toHaveAttribute(
      "href",
      "/nodo/projects/proj-1",
    );
  });

  it("renders the designed empty state when the queue is empty", () => {
    render(<JoinRequestQueue projectId="proj-1" projectName="Sitio web de Nodo" requests={[]} />);

    expect(screen.getByText("No hay solicitudes pendientes")).toBeInTheDocument();
    expect(screen.getByText("0 pedidos para unirse al proyecto")).toBeInTheDocument();
    expect(screen.queryByTestId("join-row")).not.toBeInTheDocument();
  });
});
