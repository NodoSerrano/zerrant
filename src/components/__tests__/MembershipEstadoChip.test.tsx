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
});
