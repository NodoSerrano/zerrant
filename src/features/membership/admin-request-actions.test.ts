import { describe, expect, it } from "vitest";
import { adminRequestActions } from "./admin-request-actions";
import { MEMBERSHIP_REQUEST_ESTADOS, nextEstados } from "./request-state";

describe("adminRequestActions", () => {
  it.each(MEMBERSHIP_REQUEST_ESTADOS)(
    "destinations for %s match the state machine for admins",
    (estado) => {
      const { actions, canClose } = adminRequestActions(estado);
      const destinations = [...actions.map((a) => a.to), ...(canClose ? ["cerrada"] : [])];
      expect([...destinations].sort()).toEqual([...nextEstados(estado, "admin")].sort());
    },
  );

  it("never uses reject wording", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      for (const action of adminRequestActions(estado).actions) {
        expect(action.label.toLowerCase()).not.toContain("rechaz");
      }
    }
  });

  it("exposes at most one primary action, listed before secondaries", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      const variants = adminRequestActions(estado).actions.map((a) => a.variant);
      expect(variants.filter((v) => v === "primary").length).toBeLessThanOrEqual(1);
      if (variants.length > 1) expect(variants[0]).toBe("primary");
    }
  });

  it("maps each active estado to the 6.1b frame actions", () => {
    expect(adminRequestActions("pendiente_coordinacion").actions).toEqual([
      {
        to: "entrevista_solicitada",
        label: "Solicitar entrevista",
        variant: "primary",
        icon: "calendar-plus",
      },
    ]);
    expect(adminRequestActions("entrevista_solicitada").actions).toEqual([
      {
        to: "entrevista_coordinada",
        label: "Confirmar horario",
        variant: "primary",
        icon: "calendar-check",
      },
      { to: "reprogramacion", label: "Reprogramar", variant: "secondary", icon: "calendar-clock" },
    ]);
    expect(adminRequestActions("entrevista_coordinada").actions).toEqual([
      {
        to: "entrevista_realizada",
        label: "Marcar entrevista realizada",
        variant: "primary",
        icon: "check",
      },
      { to: "reprogramacion", label: "Reprogramar", variant: "secondary", icon: "calendar-clock" },
    ]);
    expect(adminRequestActions("reprogramacion").actions).toEqual([
      {
        to: "entrevista_coordinada",
        label: "Confirmar horario",
        variant: "primary",
        icon: "calendar-check",
      },
      {
        to: "entrevista_solicitada",
        label: "Pedir otro horario",
        variant: "secondary",
        icon: "calendar-plus",
      },
    ]);
    expect(adminRequestActions("entrevista_realizada").actions).toEqual([
      { to: "aprobado", label: "Aprobar como miembro", variant: "primary", icon: "check" },
    ]);
  });

  it("offers no actions for terminal estados", () => {
    for (const estado of ["aprobado", "cerrada"] as const) {
      expect(adminRequestActions(estado)).toEqual({ actions: [], canClose: false });
    }
  });
});
