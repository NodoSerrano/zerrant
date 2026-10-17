import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MembershipEstadoChip } from "../MembershipEstadoChip";
import { MEMBERSHIP_REQUEST_ESTADOS, estadoLabel } from "@/features/membership/request-state";

describe("MembershipEstadoChip", () => {
  it.each(MEMBERSHIP_REQUEST_ESTADOS)("never wraps or shrinks the %s label", (estado) => {
    render(<MembershipEstadoChip estado={estado} />);
    const chip = screen.getByText(estadoLabel(estado)).closest("[data-estado-chip]");
    expect(chip?.className).toMatch(/\bwhitespace-nowrap\b/);
    expect(chip?.className).toMatch(/\bshrink-0\b/);
  });

  it("tells the two final estados apart from each other and from the in-progress ones", () => {
    const toneOf = (estado: (typeof MEMBERSHIP_REQUEST_ESTADOS)[number]) => {
      const { unmount } = render(<MembershipEstadoChip estado={estado} />);
      const className =
        screen.getByText(estadoLabel(estado)).closest("[data-estado-chip]")?.className ?? "";
      unmount();
      return className;
    };
    const aprobado = toneOf("aprobado");
    const cerrada = toneOf("cerrada");
    expect(aprobado).not.toBe(cerrada);
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS.filter(
      (e) => e !== "aprobado" && e !== "cerrada",
    )) {
      const tone = toneOf(estado);
      expect(tone).not.toBe(aprobado);
      expect(tone).not.toBe(cerrada);
    }
  });
});
