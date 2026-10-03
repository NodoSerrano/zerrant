import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PendingMembershipCard } from "./PendingMembershipCard";
import {
  MEMBERSHIP_REQUEST_ACTIVE_ESTADOS,
  estadoLabel,
} from "@/features/membership/request-state";

const DESCRIPTIONS = {
  pendiente_coordinacion:
    "Recibimos tu solicitud. Un admin de Nodo te va a contactar para coordinar una entrevista.",
  entrevista_solicitada:
    "Te propusimos una entrevista. Te vamos a escribir por el contacto que dejaste para elegir horario.",
  entrevista_coordinada: "Tu entrevista ya tiene horario. ¡Nos vemos en el Nodo!",
  reprogramacion:
    "El horario que coordinamos no está disponible. Te vamos a proponer uno nuevo: tu solicitud sigue en curso.",
  entrevista_realizada:
    "Gracias por la entrevista. Falta la confirmación final para que pases de Turista a Serrano.",
} as const;

describe("PendingMembershipCard", () => {
  it("uses design tokens instead of light-only hex for status chrome (ZER-110)", () => {
    const { container } = render(<PendingMembershipCard estado="pendiente_coordinacion" />);

    expect(screen.getByText("Tu solicitud de membresía")).toBeInTheDocument();

    const html = container.innerHTML;
    expect(html).not.toMatch(/bg-\[#|text-\[#|border-\[#/);
    expect(html).toMatch(/warm-yellow|warm-orange/);
    expect(html).toMatch(/text-text-secondary|text-secondary|text-text-primary/);
  });

  it.each(MEMBERSHIP_REQUEST_ACTIVE_ESTADOS)("renders chip and description for %s", (estado) => {
    const { container } = render(<PendingMembershipCard estado={estado} />);

    expect(screen.getByText(estadoLabel(estado))).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTIONS[estado as keyof typeof DESCRIPTIONS])).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain("rechaz");
  });

  it("shows Reprogramación requerida for reprogramacion", () => {
    const { container } = render(<PendingMembershipCard estado="reprogramacion" />);

    expect(screen.getByText("Reprogramación requerida")).toBeInTheDocument();
    expect(container.textContent?.toLowerCase()).not.toContain("rechaz");
  });

  it.each([
    ["reprogramacion", "border-warm-yellow"],
    ["entrevista_coordinada", "border-brand-blue"],
    ["entrevista_realizada", "border-brand-green"],
    ["pendiente_coordinacion", "border-border"],
  ] as const)("tones the %s chip like the admin card", (estado, cls) => {
    render(<PendingMembershipCard estado={estado} />);
    const chip = screen.getByText(estadoLabel(estado)).closest("[data-estado-chip]");
    expect(chip?.className).toContain(cls);
  });
});
