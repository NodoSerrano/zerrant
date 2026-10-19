import { describe, expect, it } from "vitest";
import {
  closingEvent,
  groupEventsByRequest,
  historyEstados,
  lastChangeOf,
  parseHistoryFilter,
  parseVista,
  type RequestEventRow,
} from "./request-history";

const ANA = {
  nombre: "Ana",
  apellido: "Admin",
  apodo: null,
  nombre_visible: "nombre_apellido" as const,
};
const LU = { nombre: "Lucía", apellido: "Gómez", apodo: "Lu", nombre_visible: "apodo" as const };

function row(overrides: Partial<RequestEventRow>): RequestEventRow {
  return {
    id: "ev",
    request_id: "req-1",
    from_estado: null,
    to_estado: "pendiente_coordinacion",
    actor_id: "user-1",
    motivo: null,
    created_at: "2026-10-01T12:00:00.000Z",
    profiles: LU,
    ...overrides,
  } as RequestEventRow;
}

const created = row({ id: "ev-1" });
const requested = row({
  id: "ev-2",
  from_estado: "pendiente_coordinacion",
  to_estado: "entrevista_solicitada",
  actor_id: "admin-1",
  created_at: "2026-10-02T12:00:00.000Z",
  profiles: ANA,
});
const closed = row({
  id: "ev-3",
  from_estado: "entrevista_solicitada",
  to_estado: "cerrada",
  actor_id: "admin-1",
  motivo: "No respondió",
  created_at: "2026-10-05T12:00:00.000Z",
  profiles: [ANA],
});

describe("parseVista", () => {
  it("defaults to the in-progress queue", () => {
    expect(parseVista(undefined)).toBe("en_curso");
    expect(parseVista("cualquier-cosa")).toBe("en_curso");
  });

  it("recognizes the history view", () => {
    expect(parseVista("historial")).toBe("historial");
  });
});

describe("parseHistoryFilter / historyEstados", () => {
  it("defaults to every final estado", () => {
    expect(parseHistoryFilter(undefined)).toBe("todas");
    expect(parseHistoryFilter("pendiente_coordinacion")).toBe("todas");
    expect(historyEstados("todas")).toEqual(["aprobado", "cerrada"]);
  });

  it("narrows to approved or closed requests", () => {
    expect(historyEstados(parseHistoryFilter("aprobado"))).toEqual(["aprobado"]);
    expect(historyEstados(parseHistoryFilter("cerrada"))).toEqual(["cerrada"]);
  });
});

describe("groupEventsByRequest", () => {
  it("groups events per request in chronological order with display names", () => {
    const other = row({ id: "ev-9", request_id: "req-2" });
    const grouped = groupEventsByRequest([closed, created, other, requested]);

    expect(grouped.get("req-1")?.map((e) => e.id)).toEqual(["ev-1", "ev-2", "ev-3"]);
    expect(grouped.get("req-2")?.map((e) => e.id)).toEqual(["ev-9"]);
    expect(grouped.get("req-1")?.[0]).toMatchObject({ actorName: "Lu", from: null });
    expect(grouped.get("req-1")?.[2]).toMatchObject({
      actorName: "Ana Admin",
      from: "entrevista_solicitada",
      to: "cerrada",
      motivo: "No respondió",
      at: "2026-10-05T12:00:00.000Z",
    });
  });

  it("names changes without a recorded actor as made by the system", () => {
    const grouped = groupEventsByRequest([row({ actor_id: null, profiles: null })]);
    expect(grouped.get("req-1")?.[0].actorName).toBe("Sistema");
  });
});

describe("lastChangeOf", () => {
  it("returns the latest estado change with actor, date and motivo", () => {
    const events = groupEventsByRequest([created, requested, closed]).get("req-1") ?? [];
    expect(lastChangeOf(events)).toEqual({
      actorName: "Ana Admin",
      at: "2026-10-05T12:00:00.000Z",
      motivo: "No respondió",
    });
  });

  it("ignores the creation event: a brand-new request has no change yet", () => {
    const events = groupEventsByRequest([created]).get("req-1") ?? [];
    expect(lastChangeOf(events)).toBeNull();
  });
});

describe("closingEvent", () => {
  it("is the event that moved the request into its final estado", () => {
    const events = groupEventsByRequest([created, requested, closed]).get("req-1") ?? [];
    expect(closingEvent(events, "cerrada")?.id).toBe("ev-3");
  });

  it("is null when the log has no matching event", () => {
    const events = groupEventsByRequest([created]).get("req-1") ?? [];
    expect(closingEvent(events, "aprobado")).toBeNull();
  });
});
