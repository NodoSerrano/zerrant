import { describe, expect, it } from "vitest";
import { DISPONIBILIDAD_CONFIG, getDisponibilidad } from "./disponibilidadDisplay";

// ZER-210: same traffic-light legibility as task urgency, on the profile
// `disponibilidad` enum. Tokens stay on the ZER-175 palette.
describe("getDisponibilidad", () => {
  it.each([
    ["disponible", "Disponible", "text-brand-green"],
    ["ocupado", "Ocupado", "text-warm-red"],
    ["solo_eventos", "Solo eventos", "text-warm-orange"],
  ] as const)("maps %s to its label and colour", (value, label, color) => {
    expect(getDisponibilidad(value)).toEqual({ label, color });
  });

  it("falls back to ocupado for a value it does not know", () => {
    expect(getDisponibilidad("vacaciones")).toEqual(DISPONIBILIDAD_CONFIG.ocupado);
  });
});
