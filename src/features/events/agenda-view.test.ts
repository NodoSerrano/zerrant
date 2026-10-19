import { describe, expect, it } from "vitest";
import { buildAgendaSections, parseAgendaVista } from "./agenda-view";
import type { AgendaListItem } from "./luma-normalize";

// Mon 19 Oct 2026, 15:00 in Argentina (UTC-3).
const NOW = new Date("2026-10-19T18:00:00.000Z");

function item(id: string, inicio: string, fin: string | null = null): AgendaListItem {
  return {
    id,
    title: id,
    inicio,
    fin,
    place: null,
    href: `/agenda/${id}`,
    source: "internal",
    coverUrl: null,
  };
}

const ITEMS = [
  item("ayer", "2026-10-18T22:00:00.000Z"),
  item("en-curso", "2026-10-19T16:00:00.000Z", "2026-10-19T20:00:00.000Z"),
  item("hoy-noche", "2026-10-19T23:30:00.000Z"),
  item("manana", "2026-10-20T13:00:00.000Z"),
  item("semana-que-viene", "2026-10-26T11:00:00.000Z"),
  item("noviembre", "2026-11-03T23:00:00.000Z"),
  item("septiembre", "2026-09-10T22:00:00.000Z"),
];

describe("parseAgendaVista", () => {
  it("defaults to upcoming events", () => {
    expect(parseAgendaVista(undefined)).toBe("proximos");
    expect(parseAgendaVista("cualquiera")).toBe("proximos");
  });

  it("recognizes past events", () => {
    expect(parseAgendaVista("pasados")).toBe("pasados");
  });
});

describe("buildAgendaSections — upcoming", () => {
  const sections = buildAgendaSections(ITEMS, { vista: "proximos", now: NOW });
  const days = sections.flatMap((s) => s.days);
  const ids = days.flatMap((d) => d.items.map((i) => i.id));

  it("keeps only what has not ended yet, an ongoing event included, soonest first", () => {
    expect(ids).toEqual(["en-curso", "hoy-noche", "manana", "semana-que-viene", "noviembre"]);
  });

  it("groups by month, then by day, in the agenda time zone", () => {
    expect(sections.map((s) => s.label)).toEqual(["Octubre 2026", "Noviembre 2026"]);
    // 23:30 UTC on the 19th is still the 19th in Argentina.
    expect(days[0].items.map((i) => i.id)).toEqual(["en-curso", "hoy-noche"]);
  });

  it("names today and tomorrow, and spells out the rest", () => {
    expect(days.map((d) => d.label)).toEqual([
      "Hoy · lun 19 oct",
      "Mañana · mar 20 oct",
      "lun 26 oct",
      "mar 3 nov",
    ]);
  });
});

describe("buildAgendaSections — past", () => {
  const sections = buildAgendaSections(ITEMS, { vista: "pasados", now: NOW });
  const days = sections.flatMap((s) => s.days);

  it("lists ended events, most recent first", () => {
    expect(days.flatMap((d) => d.items.map((i) => i.id))).toEqual(["ayer", "septiembre"]);
    expect(sections.map((s) => s.label)).toEqual(["Octubre 2026", "Septiembre 2026"]);
  });

  it("names yesterday", () => {
    expect(days[0].label).toBe("Ayer · dom 18 oct");
  });
});

describe("buildAgendaSections — empty", () => {
  it("returns no sections when nothing matches", () => {
    expect(buildAgendaSections([], { vista: "proximos", now: NOW })).toEqual([]);
  });
});
