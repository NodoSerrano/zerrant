import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequestCard, type RequestCardData } from "../RequestCard";
import type { Profile } from "@/features/profile/types";

vi.mock("@/features/admin/actions", () => ({
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

const mockProfile = {
  nombre: "Sofía",
  apellido: "Vega",
  apodo: null,
  nombre_visible: "nombre_apellido" as const,
  avatar_url: null,
  tier: "tourist" as const,
} as Profile;

const mockRequest: RequestCardData = {
  id: "req-001",
  profile: mockProfile,
  mensaje: "Quiero ayudar con la huerta",
  created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
};

const mockRequestNoMessage: RequestCardData = {
  ...mockRequest,
  mensaje: null,
};

describe("RequestCard", () => {
  it("renders the requester name via displayName", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
  });

  it("renders relative time meta text", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText(/Solicitó hace/)).toBeInTheDocument();
  });

  it("renders the mensaje when present", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Quiero ayudar con la huerta")).toBeInTheDocument();
  });

  it("does not render mensaje section when null", () => {
    render(<RequestCard request={mockRequestNoMessage} />);
    expect(screen.queryByText("Quiero ayudar con la huerta")).not.toBeInTheDocument();
  });

  it("renders avatar with correct initials", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("SV")).toBeInTheDocument();
  });

  it("renders Aprobar button", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Aprobar")).toBeInTheDocument();
  });

  it("renders Rechazar button", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
  });

  it("has hidden input with request id in approve form", () => {
    render(<RequestCard request={mockRequest} />);
    const approveForm = screen.getByText("Aprobar").closest("form");
    expect(approveForm).toBeInTheDocument();
    const input = approveForm?.querySelector('input[name="requestId"]');
    expect(input).toHaveAttribute("value", "req-001");
  });

  it("has hidden input with request id in reject form", () => {
    render(<RequestCard request={mockRequest} />);
    const rejectForm = screen.getByText("Rechazar").closest("form");
    expect(rejectForm).toBeInTheDocument();
    const input = rejectForm?.querySelector('input[name="requestId"]');
    expect(input).toHaveAttribute("value", "req-001");
  });

  it("renders with Pencil border radius 24px", () => {
    const { container } = render(<RequestCard request={mockRequest} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded-[24px]");
  });
});
