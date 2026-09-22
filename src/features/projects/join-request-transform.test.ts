import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  joinRequestCountLabel,
  joinRequestMetaLabel,
  toJoinRequestQueue,
} from "./join-request-transform";

describe("toJoinRequestQueue", () => {
  it("keeps only pendiente rows and maps display fields via shared name rules", () => {
    const rows = toJoinRequestQueue([
      {
        profile_id: "u1",
        estado: "aprobado",
        created_at: "2026-09-01T00:00:00Z",
        profiles: {
          id: "u1",
          nombre: "Admin",
          apellido: "One",
          apodo: null,
          nombre_visible: "nombre_apellido",
          avatar_url: null,
        },
      },
      {
        profile_id: "u2",
        estado: "pendiente",
        created_at: "2026-09-20T12:00:00Z",
        profiles: {
          id: "u2",
          nombre: "Martín",
          apellido: "Paz",
          apodo: null,
          nombre_visible: "nombre_apellido",
          avatar_url: "https://example.com/a.png",
        },
      },
    ]);

    expect(rows).toEqual([
      {
        profileId: "u2",
        name: "Martín Paz",
        avatarUrl: "https://example.com/a.png",
        subtitle: null,
        createdAt: "2026-09-20T12:00:00Z",
      },
    ]);
  });

  it("formats apellido_nombre enum for pending requesters", () => {
    const rows = toJoinRequestQueue([
      {
        profile_id: "u3",
        estado: "pendiente",
        created_at: "2026-09-20T12:00:00Z",
        profiles: {
          id: "u3",
          nombre: "Juan",
          apellido: "Peñalba",
          apodo: null,
          nombre_visible: "apellido_nombre",
          avatar_url: null,
        },
      },
    ]);

    expect(rows[0]?.name).toBe("Peñalba Juan");
  });

  it("returns an empty list when there are no pending rows", () => {
    expect(toJoinRequestQueue([])).toEqual([]);
    expect(toJoinRequestQueue(null)).toEqual([]);
  });
});

describe("joinRequestCountLabel", () => {
  it("singularizes one request", () => {
    expect(joinRequestCountLabel(1)).toBe("1 pedido para unirse al proyecto");
  });

  it("pluralizes zero and many", () => {
    expect(joinRequestCountLabel(0)).toBe("0 pedidos para unirse al proyecto");
    expect(joinRequestCountLabel(2)).toBe("2 pedidos para unirse al proyecto");
  });
});

describe("joinRequestMetaLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes relative time when createdAt is present", () => {
    expect(joinRequestMetaLabel("2026-09-20T12:00:00Z")).toBe("Quiere unirse · hace 1 día");
  });

  it("falls back without a timestamp", () => {
    expect(joinRequestMetaLabel(null)).toBe("Quiere unirse");
  });
});
