import { describe, expect, it } from "vitest";
import { assertTaskUpdateAllowed, type TaskGuardRow } from "./task-update-guard";

const creator = "user-a";
const taker = "user-b";
const stranger = "user-c";

function openTask(overrides: Partial<TaskGuardRow> = {}): TaskGuardRow {
  return {
    estado: "abierta",
    creado_por: creator,
    tomada_por: null,
    titulo: "Arreglar caño",
    descripcion: "Baño",
    categoria: "reparacion",
    urgencia: "media",
    ...overrides,
  };
}

function takenTask(overrides: Partial<TaskGuardRow> = {}): TaskGuardRow {
  return openTask({ estado: "tomada", tomada_por: taker, ...overrides });
}

describe("assertTaskUpdateAllowed (ZER-42)", () => {
  it("denies taker setting estado=verificada (PostgREST auto-verify bypass)", () => {
    const oldRow = takenTask({ estado: "hecha" });
    const newRow = { ...oldRow, estado: "verificada" as const };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: taker, isAdmin: false })).toEqual({
      ok: false,
      reason: "only admin may set verificada",
    });
  });

  it("denies taker rewriting titulo/descripcion", () => {
    const oldRow = takenTask();
    const newRow = { ...oldRow, titulo: "Hackeado", descripcion: "contenido ajeno" };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: taker, isAdmin: false })).toEqual({
      ok: false,
      reason: "taker cannot edit content",
    });
  });

  it("allows taker abierta→tomada claim", () => {
    const oldRow = openTask();
    const newRow = { ...oldRow, estado: "tomada" as const, tomada_por: taker };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: taker, isAdmin: false })).toEqual({
      ok: true,
    });
  });

  it("allows taker tomada→hecha", () => {
    const oldRow = takenTask();
    const newRow = { ...oldRow, estado: "hecha" as const };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: taker, isAdmin: false })).toEqual({
      ok: true,
    });
  });

  it("allows admin hecha→verificada", () => {
    const oldRow = takenTask({ estado: "hecha" });
    const newRow = { ...oldRow, estado: "verificada" as const };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: stranger, isAdmin: true })).toEqual({
      ok: true,
    });
  });

  it("denies non-admin hecha→verificada even if creator", () => {
    const oldRow = takenTask({ estado: "hecha", creado_por: creator });
    const newRow = { ...oldRow, estado: "verificada" as const };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: creator, isAdmin: false }).ok).toBe(false);
  });

  it("allows creator cancel abierta|tomada→cancelada", () => {
    const open = openTask();
    expect(
      assertTaskUpdateAllowed(
        open,
        { ...open, estado: "cancelada" },
        { id: creator, isAdmin: false },
      ),
    ).toEqual({ ok: true });

    const taken = takenTask();
    expect(
      assertTaskUpdateAllowed(
        taken,
        { ...taken, estado: "cancelada" },
        { id: creator, isAdmin: false },
      ),
    ).toEqual({ ok: true });
  });

  it("denies taker cancel", () => {
    const oldRow = takenTask();
    const newRow = { ...oldRow, estado: "cancelada" as const };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: taker, isAdmin: false }).ok).toBe(false);
  });

  it("allows creator content edit only while abierta", () => {
    const open = openTask();
    expect(
      assertTaskUpdateAllowed(
        open,
        { ...open, titulo: "Nuevo título", descripcion: null },
        { id: creator, isAdmin: false },
      ),
    ).toEqual({ ok: true });

    const taken = takenTask();
    expect(
      assertTaskUpdateAllowed(taken, { ...taken, titulo: "Tarde" }, { id: creator, isAdmin: false })
        .ok,
    ).toBe(false);
  });

  it("denies mutating creado_por", () => {
    const oldRow = openTask();
    const newRow = { ...oldRow, creado_por: taker };

    expect(assertTaskUpdateAllowed(oldRow, newRow, { id: creator, isAdmin: false })).toEqual({
      ok: false,
      reason: "creado_por is immutable",
    });
  });
});
