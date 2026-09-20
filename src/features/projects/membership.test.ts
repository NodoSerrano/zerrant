import { describe, expect, it } from "vitest";
import { isProjectAdmin, resolveJoinAffordance } from "./membership";

describe("resolveJoinAffordance", () => {
  it("returns Unirse for abierto projects when the viewer has no membership row", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "abierto",
        viewerMembership: null,
      }),
    ).toEqual({ kind: "join", label: "Unirse" });
  });

  it("returns Solicitar ingreso for aprobacion projects when the viewer has no membership row", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "aprobacion",
        viewerMembership: null,
      }),
    ).toEqual({ kind: "join", label: "Solicitar ingreso" });
  });

  it("returns a pending indicator when the viewer already has a pendiente row", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "abierto",
        viewerMembership: { estado: "pendiente", rol: "miembro" },
      }),
    ).toEqual({ kind: "pending", label: "Solicitud pendiente" });

    expect(
      resolveJoinAffordance({
        ingreso: "aprobacion",
        viewerMembership: { estado: "pendiente", rol: "miembro" },
      }),
    ).toEqual({ kind: "pending", label: "Solicitud pendiente" });
  });

  it("returns none when the viewer is already an aprobado member", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "abierto",
        viewerMembership: { estado: "aprobado", rol: "miembro" },
      }),
    ).toEqual({ kind: "none" });

    expect(
      resolveJoinAffordance({
        ingreso: "aprobacion",
        viewerMembership: { estado: "aprobado", rol: "admin" },
      }),
    ).toEqual({ kind: "none" });
  });

  it("treats only aprobado + admin as project admin for the queue entry", () => {
    expect(
      isProjectAdmin({
        viewerMembership: { estado: "aprobado", rol: "admin" },
      }),
    ).toBe(true);

    expect(
      isProjectAdmin({
        viewerMembership: { estado: "pendiente", rol: "admin" },
      }),
    ).toBe(false);

    expect(
      isProjectAdmin({
        viewerMembership: { estado: "aprobado", rol: "miembro" },
      }),
    ).toBe(false);

    expect(isProjectAdmin({ viewerMembership: null })).toBe(false);
  });
});
