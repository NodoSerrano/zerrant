import { describe, expect, it } from "vitest";
import {
  agendaDayKeys,
  filterAgendaItemsByDay,
  lumaEventPublicUrl,
  mergeAgendaListItems,
  normalizeLumaCalendarEntries,
  takeUpcomingAgendaItems,
} from "./luma-normalize";
import type { AgendaListItem } from "./luma-normalize";

const SAMPLE_ENTRY = {
  api_id: "calev-smVATjiTMtJ8XYx",
  start_at: "2026-09-24T21:00:00.000Z",
  event: {
    api_id: "evt-2bcNCPALL1MnfaQ",
    name: "La fija de los jueves: pysap",
    start_at: "2026-09-24T21:00:00.000Z",
    end_at: "2026-09-24T22:00:00.000Z",
    url: "iajzrmdr",
    geo_address_info: {
      short_address: "San Martín 864, Tandil",
      address: "Nodo Serrano",
      city: "Tandil",
    },
  },
};

describe("lumaEventPublicUrl", () => {
  it("builds a luma.com URL from the event slug", () => {
    expect(lumaEventPublicUrl("iajzrmdr")).toBe("https://luma.com/iajzrmdr");
  });

  it("passes through absolute http(s) URLs", () => {
    expect(lumaEventPublicUrl("https://lu.ma/abc")).toBe("https://lu.ma/abc");
  });
});

describe("normalizeLumaCalendarEntries", () => {
  it("maps Luma calendar entries to agenda list items", () => {
    const [item] = normalizeLumaCalendarEntries([SAMPLE_ENTRY]);
    expect(item).toEqual({
      id: "luma:evt-2bcNCPALL1MnfaQ",
      title: "La fija de los jueves: pysap",
      inicio: "2026-09-24T21:00:00.000Z",
      fin: "2026-09-24T22:00:00.000Z",
      place: "San Martín 864, Tandil",
      href: "https://luma.com/iajzrmdr",
      source: "luma",
      coverUrl: null,
    });
  });

  it("maps cover_url when present and falls back to social_image_url", () => {
    const [withCover] = normalizeLumaCalendarEntries([
      {
        event: {
          api_id: "evt-cover",
          name: "Con cover",
          start_at: "2026-09-24T21:00:00.000Z",
          end_at: null,
          url: "cover-slug",
          cover_url: "https://images.lumacdn.com/uploads/cover.png",
          social_image_url: "https://images.lumacdn.com/event-social/social.png",
        },
      },
    ]);
    expect(withCover.coverUrl).toBe("https://images.lumacdn.com/uploads/cover.png");

    const [withSocial] = normalizeLumaCalendarEntries([
      {
        event: {
          api_id: "evt-social",
          name: "Con social",
          start_at: "2026-09-24T21:00:00.000Z",
          end_at: null,
          url: "social-slug",
          cover_url: null,
          social_image_url: "https://images.lumacdn.com/event-social/social.png",
        },
      },
    ]);
    expect(withSocial.coverUrl).toBe("https://images.lumacdn.com/event-social/social.png");
  });

  it("skips entries without a usable event payload", () => {
    expect(normalizeLumaCalendarEntries([{ api_id: "x" }, { event: null }])).toEqual([]);
  });

  it("falls back place to address then city", () => {
    const [a] = normalizeLumaCalendarEntries([
      {
        event: {
          api_id: "evt-a",
          name: "A",
          start_at: "2026-09-24T21:00:00.000Z",
          end_at: null,
          url: "aaa",
          geo_address_info: { address: "Nodo Serrano", city: "Tandil" },
        },
      },
    ]);
    expect(a.place).toBe("Nodo Serrano");

    const [b] = normalizeLumaCalendarEntries([
      {
        event: {
          api_id: "evt-b",
          name: "B",
          start_at: "2026-09-24T21:00:00.000Z",
          end_at: null,
          url: "bbb",
          geo_address_info: { city: "Tandil" },
        },
      },
    ]);
    expect(b.place).toBe("Tandil");
  });
});

describe("mergeAgendaListItems", () => {
  const internal: AgendaListItem = {
    id: "int-1",
    title: "Asamblea",
    inicio: "2026-09-24T18:00:00.000Z",
    fin: null,
    place: "Salón",
    href: "/agenda/int-1",
    source: "internal",
    coverUrl: null,
  };
  const luma: AgendaListItem = {
    id: "luma:evt-1",
    title: "Meetup",
    inicio: "2026-09-24T21:00:00.000Z",
    fin: null,
    place: "Hub",
    href: "https://luma.com/x",
    source: "luma",
    coverUrl: null,
  };

  it("sorts by inicio ascending and keeps both sources", () => {
    expect(mergeAgendaListItems([luma], [internal]).map((i) => i.id)).toEqual([
      "int-1",
      "luma:evt-1",
    ]);
  });

  it("dedupes near-identical title+start preferring internal", () => {
    const dup: AgendaListItem = {
      ...luma,
      id: "luma:dup",
      title: "asamblea",
      inicio: "2026-09-24T18:00:00.000Z",
    };
    const merged = mergeAgendaListItems([dup], [internal]);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe("internal");
  });
});

describe("filterAgendaItemsByDay", () => {
  it("keeps items whose inicio falls on the agenda-TZ day key", () => {
    const items: AgendaListItem[] = [
      {
        id: "a",
        title: "A",
        inicio: "2026-09-24T21:00:00.000Z", // 18:00 ART
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
      {
        id: "b",
        title: "B",
        inicio: "2026-09-25T02:30:00.000Z", // 23:30 ART same day Sep 24
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
      {
        id: "c",
        title: "C",
        inicio: "2026-09-25T03:00:00.000Z", // 00:00 ART Sep 25
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
    ];
    expect(filterAgendaItemsByDay(items, "2026-09-24").map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("agendaDayKeys", () => {
  it("returns unique agenda-TZ day keys in first-seen order", () => {
    const items: AgendaListItem[] = [
      {
        id: "a",
        title: "A",
        inicio: "2026-09-24T21:00:00.000Z",
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
      {
        id: "b",
        title: "B",
        inicio: "2026-09-20T18:00:00-03:00",
        fin: null,
        place: null,
        href: "#",
        source: "internal",
        coverUrl: null,
      },
      {
        id: "a2",
        title: "A2",
        inicio: "2026-09-24T22:00:00.000Z",
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
    ];
    expect(agendaDayKeys(items)).toEqual(["2026-09-24", "2026-09-20"]);
  });
});

describe("takeUpcomingAgendaItems", () => {
  it("keeps items with inicio >= now and respects limit", () => {
    const now = new Date("2026-09-24T12:00:00.000Z");
    const items: AgendaListItem[] = [
      {
        id: "past",
        title: "P",
        inicio: "2026-09-24T11:00:00.000Z",
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
      {
        id: "a",
        title: "A",
        inicio: "2026-09-24T13:00:00.000Z",
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
      {
        id: "b",
        title: "B",
        inicio: "2026-09-24T14:00:00.000Z",
        fin: null,
        place: null,
        href: "#",
        source: "luma",
        coverUrl: null,
      },
    ];
    expect(takeUpcomingAgendaItems(items, now, 1).map((i) => i.id)).toEqual(["a"]);
  });
});
