import { describe, expect, it } from "vitest";
import { mapInicioEvents } from "./map-inicio-events";
import type { AgendaEvent } from "@/features/events/types";

const base: AgendaEvent = {
  id: "e1",
  titulo: "Asamblea",
  descripcion: null,
  lugar: "Salón",
  inicio: "2026-09-20T18:00:00-03:00",
  fin: "2026-09-20T20:00:00-03:00",
  creado_por: "u1",
};

describe("mapInicioEvents", () => {
  it("uses time-only label when the event is today in agenda TZ", () => {
    const now = new Date("2026-09-20T12:00:00-03:00");
    const [item] = mapInicioEvents([base], now);
    expect(item.timeLabel).toMatch(/18:00/);
    expect(item.timeLabel).not.toContain("2026-09-20");
    expect(item.href).toBe("/agenda/e1");
    expect(item.title).toBe("Asamblea");
  });

  it("prefixes the civil day when the event is not today", () => {
    const now = new Date("2026-09-19T12:00:00-03:00");
    const [item] = mapInicioEvents([base], now);
    expect(item.timeLabel).toContain("2026-09-20");
    expect(item.timeLabel).toMatch(/18:00/);
  });
});
