import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestCard, type RequestCardData } from "../RequestCard";
import { MEMBERSHIP_REQUEST_ESTADOS, estadoLabel } from "@/features/membership/request-state";
import type { Profile } from "@/features/profile/types";

const mocks = vi.hoisted(() => ({
  transitionRequest: vi.fn(),
}));

vi.mock("@/features/admin/actions", () => ({
  transitionRequest: mocks.transitionRequest,
}));

const mockProfile = {
  id: "profile-1",
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
  estado: "pendiente_coordinacion",
};

const mockRequestNoMessage: RequestCardData = {
  ...mockRequest,
  mensaje: null,
};

const mockRequestWithScreening: RequestCardData = {
  ...mockRequest,
  mensaje: "nota libre",
  screening: {
    contacto_whatsapp: "1122334455",
    frecuencia_uso: "1_semana",
    duracion_visita: "2_4h",
    aporte_actitud: "comodo",
    reunion_disponibilidad: "Martes 18hs",
    situacion_actual: "trabajo",
    ocupacion_detalle: "Dev",
    entrevista_items: "espacio",
    aporte_otro: "charlas",
    aporte_mayor: "si",
    mensaje: "nota libre",
  },
};

describe("RequestCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the requester name via displayName", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
  });

  it("renders relative time meta text next to the chip", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("hace 5 horas")).toBeInTheDocument();
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

  it("meta row wraps the relative date whole onto the next line instead of breaking it", () => {
    render(<RequestCard request={mockRequest} />);
    const date = screen.getByText("hace 5 horas");
    expect(date.className).toMatch(/\bwhitespace-nowrap\b/);
    expect(date.parentElement?.className).toMatch(/\bflex-wrap\b/);
  });

  it("renders the estado chip with its label", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByText("Pendiente de coordinación")).toBeInTheDocument();
  });

  it.each([
    ["reprogramacion", "border-warm-yellow"],
    ["entrevista_coordinada", "border-brand-blue"],
    ["entrevista_realizada", "border-brand-green"],
    ["pendiente_coordinacion", "border-border"],
    ["entrevista_solicitada", "border-border"],
  ] as const)("tones the %s chip with %s", (estado, cls) => {
    render(<RequestCard request={{ ...mockRequest, estado }} />);
    const chip = screen.getByText(estadoLabel(estado)).closest("[data-estado-chip]");
    expect(chip?.className).toContain(cls);
  });

  it("shows the booked slot and who it belongs to via the applicant card", () => {
    render(
      <RequestCard
        request={{
          ...mockRequest,
          booking: {
            starts_at: "2026-10-07T18:00:00.000Z",
            ends_at: "2026-10-07T18:30:00.000Z",
          },
        }}
      />,
    );
    expect(screen.getByText(/Entrevista:/)).toBeInTheDocument();
    expect(screen.getByText("Sofía Vega")).toBeInTheDocument();
  });

  it("never shows reject copy", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      const { container, unmount } = render(<RequestCard request={{ ...mockRequest, estado }} />);
      expect(container.textContent).not.toMatch(/rechaz/i);
      unmount();
    }
  });

  it.each([
    ["pendiente_coordinacion", ["Solicitar entrevista", "Cerrar solicitud"]],
    ["entrevista_solicitada", ["Confirmar horario", "Reprogramar", "Cerrar solicitud"]],
    ["entrevista_coordinada", ["Marcar entrevista realizada", "Reprogramar", "Cerrar solicitud"]],
    ["reprogramacion", ["Confirmar horario", "Pedir otro horario", "Cerrar solicitud"]],
    ["entrevista_realizada", ["Convertir en miembro", "Cerrar solicitud"]],
  ] as const)("renders the %s actions", (estado, labels) => {
    render(<RequestCard request={{ ...mockRequest, estado }} />);
    for (const label of labels) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button")).toHaveLength(labels.length);
  });

  it("renders no action buttons for terminal estados", () => {
    render(<RequestCard request={{ ...mockRequest, estado: "cerrada" }} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("submits transitionRequest with requestId and target estado", async () => {
    mocks.transitionRequest.mockResolvedValue(null);
    render(<RequestCard request={mockRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar entrevista" }));

    await waitFor(() => expect(mocks.transitionRequest).toHaveBeenCalled());
    const fd = mocks.transitionRequest.mock.calls[0][1] as FormData;
    expect(fd.get("requestId")).toBe("req-001");
    expect(fd.get("to")).toBe("entrevista_solicitada");
  });

  it("asks for confirmation before closing; Cancelar does not submit", async () => {
    render(<RequestCard request={mockRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar solicitud" }));
    expect(screen.getByText("¿Cerrar la solicitud de Sofía Vega?")).toBeInTheDocument();
    expect(mocks.transitionRequest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("¿Cerrar la solicitud de Sofía Vega?")).not.toBeInTheDocument();
    expect(mocks.transitionRequest).not.toHaveBeenCalled();
  });

  it("the close confirmation replaces the whole actions zone (frame tihjN)", () => {
    render(<RequestCard request={{ ...mockRequest, estado: "entrevista_realizada" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar solicitud" }));

    expect(screen.queryByRole("button", { name: "Convertir en miembro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar solicitud" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, cerrar" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: "Convertir en miembro" })).toBeInTheDocument();
  });

  it("Cerrar solicitud keeps a 44px minimum touch target", () => {
    render(<RequestCard request={mockRequest} />);
    expect(screen.getByRole("button", { name: "Cerrar solicitud" }).className).toMatch(
      /\bmin-h-\[44px\]|\bh-\[44px\]|\bh-11\b|\bmin-h-11\b/,
    );
  });

  it("Sí, cerrar submits to=cerrada", async () => {
    mocks.transitionRequest.mockResolvedValue(null);
    render(<RequestCard request={mockRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar solicitud" }));
    fireEvent.change(screen.getByLabelText("Motivo del cierre"), {
      target: { value: "No respondió" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sí, cerrar" }));

    await waitFor(() => expect(mocks.transitionRequest).toHaveBeenCalledTimes(1));
    const fd = mocks.transitionRequest.mock.calls[0][1] as FormData;
    expect(fd.get("requestId")).toBe("req-001");
    expect(fd.get("to")).toBe("cerrada");
    expect(fd.get("motivo")).toBe("No respondió");
  });

  it("the close confirmation asks for a required motivo, capped at 500 characters", () => {
    render(<RequestCard request={mockRequest} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar solicitud" }));

    const motivo = screen.getByLabelText("Motivo del cierre");
    expect(motivo).toBeRequired();
    expect(motivo).toHaveAttribute("maxLength", "500");
    expect(screen.getByText(/Solo lo ven los admins/)).toBeInTheDocument();
  });

  it("sends the estado the admin was looking at, so concurrent changes are detected", async () => {
    mocks.transitionRequest.mockResolvedValue(null);
    render(<RequestCard request={{ ...mockRequest, estado: "entrevista_solicitada" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar horario" }));

    await waitFor(() => expect(mocks.transitionRequest).toHaveBeenCalled());
    const fd = mocks.transitionRequest.mock.calls[0][1] as FormData;
    expect(fd.get("from")).toBe("entrevista_solicitada");
  });

  it("Reprogramar asks for confirmation with an optional motivo", async () => {
    mocks.transitionRequest.mockResolvedValue(null);
    render(<RequestCard request={{ ...mockRequest, estado: "entrevista_coordinada" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Reprogramar" }));
    expect(mocks.transitionRequest).not.toHaveBeenCalled();
    expect(screen.getByText("¿Reprogramar la entrevista de Sofía Vega?")).toBeInTheDocument();
    const motivo = screen.getByLabelText("Motivo (opcional)");
    expect(motivo).not.toBeRequired();

    fireEvent.change(motivo, { target: { value: "Se enfermó" } });
    fireEvent.click(screen.getByRole("button", { name: "Sí, reprogramar" }));

    await waitFor(() => expect(mocks.transitionRequest).toHaveBeenCalledTimes(1));
    const fd = mocks.transitionRequest.mock.calls[0][1] as FormData;
    expect(fd.get("to")).toBe("reprogramacion");
    expect(fd.get("motivo")).toBe("Se enfermó");
  });

  it("shows who made the last change and when, for coordination between admins", () => {
    render(
      <RequestCard
        request={{
          ...mockRequest,
          estado: "reprogramacion",
          lastChange: {
            actorName: "Ana Admin",
            at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            motivo: "Se enfermó",
          },
        }}
      />,
    );

    expect(screen.getByText(/Último cambio: Ana Admin · hace 2 horas/)).toBeInTheDocument();
    expect(screen.getByText(/Se enfermó/)).toBeInTheDocument();
  });

  it("shows the success message returned by the action", async () => {
    mocks.transitionRequest.mockResolvedValue({
      success: "Estado actualizado: Entrevista solicitada",
    });
    render(<RequestCard request={mockRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar entrevista" }));

    await waitFor(() =>
      expect(screen.getByText("Estado actualizado: Entrevista solicitada")).toBeInTheDocument(),
    );
  });

  it("shows the error message returned by the action", async () => {
    mocks.transitionRequest.mockResolvedValue({ error: "Transición no permitida" });
    render(<RequestCard request={mockRequest} />);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar entrevista" }));

    await waitFor(() => expect(screen.getByText("Transición no permitida")).toBeInTheDocument());
  });

  it("renders with Pencil border radius 24px", () => {
    const { container } = render(<RequestCard request={mockRequest} />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded-[24px]");
  });
});

describe("RequestCard — screening detail (ZER-108)", () => {
  it("renders full screening snapshot labels and values", () => {
    render(<RequestCard request={mockRequestWithScreening} />);
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("1122334455")).toBeInTheDocument();
    expect(screen.getByText("Horario reunión")).toBeInTheDocument();
    expect(screen.getByText("Martes 18hs")).toBeInTheDocument();
    expect(screen.getByText("Aproximadamente 1 vez por semana")).toBeInTheDocument();
    expect(screen.getByText("nota libre")).toBeInTheDocument();
  });
});
