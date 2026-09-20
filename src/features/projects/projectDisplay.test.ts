import { describe, expect, it } from "vitest";
import {
  getProjectEstadoBadge,
  getProjectIngresoLabel,
  isProjectIngresoApproval,
  PROJECT_ESTADO_BADGE,
} from "./projectDisplay";

describe("projectDisplay", () => {
  it("maps every project estado to a Spanish badge", () => {
    expect(getProjectEstadoBadge("idea").label).toBe("Idea");
    expect(getProjectEstadoBadge("en_curso").label).toBe("En curso");
    expect(getProjectEstadoBadge("pausado").label).toBe("Pausado");
    expect(getProjectEstadoBadge("terminado").label).toBe("Terminado");
  });

  it("falls back to idea for unknown estado values", () => {
    expect(getProjectEstadoBadge("nope")).toEqual(PROJECT_ESTADO_BADGE.idea);
  });

  it("labels ingreso modes from Pencil copy", () => {
    expect(getProjectIngresoLabel("abierto")).toBe("Abierto");
    expect(getProjectIngresoLabel("aprobacion")).toBe("Por aprobación");
    expect(isProjectIngresoApproval("aprobacion")).toBe(true);
    expect(isProjectIngresoApproval("abierto")).toBe(false);
  });
});
