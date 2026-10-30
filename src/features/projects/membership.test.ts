import { describe, expect, it } from "vitest";
import { isProjectAdmin, resolveJoinAffordance } from "./membership";

describe("resolveJoinAffordance", () => {
  it("returns Unirme for abierto projects when the viewer has no membership row", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "abierto",
        viewerMembership: null,
      }),
    ).toEqual({ kind: "join", label: "Unirme" });
  });

  it("returns Solicitar unirme for aprobacion projects when the viewer has no membership row", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "aprobacion",
        viewerMembership: null,
      }),
    ).toEqual({ kind: "join", label: "Solicitar unirme" });
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

  it("offers no way in to a cerrado project (ZER-151)", () => {
    expect(resolveJoinAffordance({ ingreso: "cerrado", viewerMembership: null })).toEqual({
      kind: "closed",
      label: "Cerrado",
    });
  });

  it("still tells members and pending applicants of a cerrado project where they stand", () => {
    expect(
      resolveJoinAffordance({
        ingreso: "cerrado",
        viewerMembership: { estado: "aprobado", rol: "miembro" },
      }),
    ).toEqual({ kind: "none" });
    expect(
      resolveJoinAffordance({
        ingreso: "cerrado",
        viewerMembership: { estado: "pendiente", rol: "miembro" },
      }),
    ).toEqual({ kind: "pending", label: "Solicitud pendiente" });
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
