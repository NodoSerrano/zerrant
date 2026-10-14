import { describe, expect, it } from "vitest";
import {
  MEMBERSHIP_REQUEST_ESTADOS,
  MEMBERSHIP_REQUEST_INITIAL_ESTADO,
  MEMBERSHIP_REQUEST_TRANSITIONS,
  MEMBERSHIP_REQUEST_ACTIVE_ESTADOS,
  canTransition,
  estadoLabel,
  isMembershipRequestEstado,
  isTerminalEstado,
  nextEstados,
  type MembershipRequestEstado,
} from "./request-state";

describe("membership request estados", () => {
  it("locks the DB enum values (no accents, no 'iniciada')", () => {
    expect(MEMBERSHIP_REQUEST_ESTADOS).toEqual([
      "pendiente_coordinacion",
      "entrevista_solicitada",
      "entrevista_coordinada",
      "reprogramacion",
      "entrevista_realizada",
      "aprobado",
      "cerrada",
    ]);
    expect(MEMBERSHIP_REQUEST_INITIAL_ESTADO).toBe("pendiente_coordinacion");
  });

  it("labels every estado with accents for UI", () => {
    expect(estadoLabel("pendiente_coordinacion")).toBe("Pendiente de coordinación");
    expect(estadoLabel("entrevista_solicitada")).toBe("Entrevista solicitada");
    expect(estadoLabel("entrevista_coordinada")).toBe("Entrevista coordinada");
    expect(estadoLabel("reprogramacion")).toBe("Reprogramación requerida");
    expect(estadoLabel("entrevista_realizada")).toBe("Entrevista realizada");
    expect(estadoLabel("aprobado")).toBe("Aprobado como miembro");
    expect(estadoLabel("cerrada")).toBe("Solicitud cerrada");
  });

  it("never labels any estado as a rejection", () => {
    for (const estado of MEMBERSHIP_REQUEST_ESTADOS) {
      expect(estadoLabel(estado).toLowerCase()).not.toMatch(/rechaz/);
    }
  });

  it("narrows unknown values", () => {
    expect(isMembershipRequestEstado("reprogramacion")).toBe(true);
    expect(isMembershipRequestEstado("reprogramación")).toBe(false);
    expect(isMembershipRequestEstado("pendiente")).toBe(false);
    expect(isMembershipRequestEstado(null)).toBe(false);
  });

  it("marks only aprobado and cerrada as terminal", () => {
    const terminal = MEMBERSHIP_REQUEST_ESTADOS.filter(isTerminalEstado);
    expect(terminal).toEqual(["aprobado", "cerrada"]);
    expect(MEMBERSHIP_REQUEST_ACTIVE_ESTADOS).toEqual(
      MEMBERSHIP_REQUEST_ESTADOS.filter((e) => !isTerminalEstado(e)),
    );
  });
});

describe("membership request transitions", () => {
  const VALID: Array<[MembershipRequestEstado, MembershipRequestEstado]> = [
    ["pendiente_coordinacion", "entrevista_solicitada"],
    ["pendiente_coordinacion", "cerrada"],
    ["entrevista_solicitada", "entrevista_coordinada"],
    ["entrevista_solicitada", "reprogramacion"],
    ["entrevista_solicitada", "cerrada"],
    ["entrevista_coordinada", "reprogramacion"],
    ["entrevista_coordinada", "entrevista_realizada"],
    ["entrevista_coordinada", "cerrada"],
    ["reprogramacion", "entrevista_solicitada"],
    ["reprogramacion", "entrevista_coordinada"],
    ["reprogramacion", "cerrada"],
    ["entrevista_realizada", "aprobado"],
    ["entrevista_realizada", "cerrada"],
  ];

  it("table contains exactly the approved admin edges", () => {
    expect(MEMBERSHIP_REQUEST_TRANSITIONS.map((t) => [t.from, t.to, t.actor])).toEqual(
      VALID.map(([from, to]) => [from, to, "admin"]),
    );
  });

  it.each(VALID)("admin can move %s → %s", (from, to) => {
    expect(canTransition(from, to, "admin")).toBe(true);
  });

  it.each(VALID)("owner cannot move %s → %s (admin-only edge)", (from, to) => {
    expect(canTransition(from, to, "owner")).toBe(false);
  });

  it("rejects every pair not in the table, including self-loops", () => {
    const valid = new Set(VALID.map(([f, t]) => `${f}>${t}`));
    for (const from of MEMBERSHIP_REQUEST_ESTADOS) {
      for (const to of MEMBERSHIP_REQUEST_ESTADOS) {
        if (valid.has(`${from}>${to}`)) continue;
        expect(canTransition(from, to, "admin"), `${from} → ${to}`).toBe(false);
      }
    }
  });

  it("rejects the issue's example aprobado → entrevista_solicitada", () => {
    expect(canTransition("aprobado", "entrevista_solicitada", "admin")).toBe(false);
  });

  it("only allows approving after the interview (strict machine)", () => {
    const fromForAprobado = MEMBERSHIP_REQUEST_ESTADOS.filter((e) =>
      canTransition(e, "aprobado", "admin"),
    );
    expect(fromForAprobado).toEqual(["entrevista_realizada"]);
  });

  it("terminal estados have no exits", () => {
    expect(nextEstados("aprobado", "admin")).toEqual([]);
    expect(nextEstados("cerrada", "admin")).toEqual([]);
  });

  it("lists next estados for an actor in table order", () => {
    expect(nextEstados("entrevista_coordinada", "admin")).toEqual([
      "reprogramacion",
      "entrevista_realizada",
      "cerrada",
    ]);
    expect(nextEstados("entrevista_coordinada", "owner")).toEqual([]);
  });
});
