import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestCard, type RequestCardData } from "../RequestCard";
import type { Profile } from "@/features/profile/types";

const mocks = vi.hoisted(() => ({
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

vi.mock("@/features/admin/actions", () => ({
  approveRequest: mocks.approveRequest,
  rejectRequest: mocks.rejectRequest,
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

  it("shows approve error message when action returns error", async () => {
    mocks.approveRequest.mockResolvedValue({ error: "Error al aprobar" });
    mocks.rejectRequest.mockResolvedValue(null);

    render(<RequestCard request={mockRequest} />);

    const approveBtn = screen.getByText("Aprobar");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByText("Error al aprobar")).toBeInTheDocument();
    });
  });

  it("shows reject error message when action returns error", async () => {
    mocks.approveRequest.mockResolvedValue(null);
    mocks.rejectRequest.mockResolvedValue({ error: "Error al rechazar" });

    render(<RequestCard request={mockRequest} />);

    const rejectBtn = screen.getByText("Rechazar");
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText("Error al rechazar")).toBeInTheDocument();
    });
  });
});
