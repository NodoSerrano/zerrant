import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgendaPage from "./page";
import { dayBoundsIso } from "@/features/events/day";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/events/luma-client", () => ({
  fetchLumaCalendarEvents: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-current": ariaCurrent,
    "aria-label": ariaLabel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-current"?: boolean | "true" | "false" | "date" | "time" | "location" | "page" | "step";
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

type EventRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  lugar: string | null;
  inicio: string;
  fin: string | null;
  creado_por: string;
};

function createEventsChain(allEvents: EventRow[]) {
  let gteVal: string | null = null;
  let ltVal: string | null = null;

  const chain: Record<string, unknown> & {
    then: (cb: (v: unknown) => void) => unknown;
  } = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockImplementation((_col: string, val: string) => {
      gteVal = val;
      return chain;
    }),
    lt: vi.fn().mockImplementation((_col: string, val: string) => {
      ltVal = val;
      return chain;
    }),
    then: (cb: (v: unknown) => void) => {
      const filtered = allEvents.filter((event) => {
        const t = new Date(event.inicio).getTime();
        if (gteVal !== null && t < new Date(gteVal).getTime()) return false;
        if (ltVal !== null && t >= new Date(ltVal).getTime()) return false;
        return true;
      });
      return cb({ data: filtered, error: null });
    },
  };

  return chain;
}

function mockSupabase(
  overrides: { events?: EventRow[]; user?: unknown; profileTier?: string | null } = {},
) {
  const { events = [], user = { id: "user-1" }, profileTier = "standard" } = overrides;
  let eventsChain: ReturnType<typeof createEventsChain> | null = null;

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "events") {
        eventsChain = createEventsChain(events);
        return eventsChain;
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: profileTier == null ? null : { tier: profileTier },
                error: null,
              }),
            }),
          }),
        };
      }
      return createEventsChain([]);
    }),
    getEventsChain: () => eventsChain,
  };
}

async function renderPage(searchParams: Record<string, string | undefined> = {}) {
  const params = Promise.resolve(searchParams);
  const element = await AgendaPage({ searchParams: params });
  return render(element);
}

const EVENT_A: EventRow = {
  id: "evt-a",
  titulo: "Asamblea",
  descripcion: null,
  lugar: "Salón",
  inicio: "2026-09-20T18:00:00-03:00",
  fin: "2026-09-20T20:00:00-03:00",
  creado_por: "user-1",
};

const EVENT_B: EventRow = {
  id: "evt-b",
  titulo: "Cena comunitaria",
  descripcion: null,
  lugar: "Cocina",
  inicio: "2026-09-21T20:00:00-03:00",
  fin: null,
  creado_por: "user-1",
};

describe("AgendaPage", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    // Fixed ART noon so "today" is 2026-09-20 regardless of process TZ
    vi.setSystemTime(new Date("2026-09-20T15:00:00-03:00"));
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      events: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not render the ZER-50 stub copy", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    await renderPage();

    expect(screen.queryByText(/milestone posterior/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/navegación del TabBar funcione sin JavaScript/i),
    ).not.toBeInTheDocument();
  });

  it("renders the Agenda header and a day strip with today selected by default", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    await renderPage();

    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument();

    const todayLink = screen.getByRole("link", { name: /dom\s*20/i });
    expect(todayLink).toHaveAttribute("aria-current", "date");
    expect(todayLink).toHaveAttribute("href", "/agenda?dia=2026-09-20");
  });

  it("shows a create entry for serranos", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ profileTier: "standard" }),
    );

    await renderPage();

    const createLink = screen.getByRole("link", { name: /Nuevo evento/i });
    expect(createLink).toHaveAttribute("href", "/agenda/new");
  });

  it("hides the create entry for tourists", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ profileTier: "tourist" }),
    );

    await renderPage();

    expect(screen.queryByRole("link", { name: /Nuevo evento/i })).not.toBeInTheDocument();
  });

  it("lists events for the selected day from the events table", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A] }),
    );

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("Salón")).toBeInTheDocument();
  });

  it("lists only the events whose inicio falls on the selected day", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A, EVENT_B] }),
    );

    await renderPage({ dia: "2026-09-20" });
    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.queryByText("Cena comunitaria")).not.toBeInTheDocument();

    cleanup();

    // Re-render for day B with a fresh mock (new query chain)
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A, EVENT_B] }),
    );
    await renderPage({ dia: "2026-09-21" });
    expect(screen.getByText("Cena comunitaria")).toBeInTheDocument();
    expect(screen.queryByText("Asamblea")).not.toBeInTheDocument();
  });

  it("links event cards to the detail route", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A] }),
    );

    await renderPage({ dia: "2026-09-20" });

    const link = screen.getByRole("link", { name: /Asamblea/i });
    expect(link).toHaveAttribute("href", "/agenda/evt-a");
  });

  it("queries events with ART-stable inicio bounds for the selected day", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = mockSupabase();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await renderPage({ dia: "2026-09-21" });

    const chain = client.getEventsChain();
    expect(chain).toBeTruthy();
    expect(chain!.gte).toHaveBeenCalled();
    expect(chain!.lt).toHaveBeenCalled();

    const expected = dayBoundsIso("2026-09-21");
    const gteArgs = (chain!.gte as ReturnType<typeof vi.fn>).mock.calls[0];
    const ltArgs = (chain!.lt as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(gteArgs[0]).toBe("inicio");
    expect(ltArgs[0]).toBe("inicio");
    expect(gteArgs[1]).toBe(expected.startIso);
    expect(ltArgs[1]).toBe(expected.endIso);
    expect(expected.startIso).toBe("2026-09-21T03:00:00.000Z");
    expect(expected.endIso).toBe("2026-09-22T03:00:00.000Z");
  });

  it("renders the agenda empty state copy, not the tasks empty copy", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ events: [] }));

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("No hay eventos")).toBeInTheDocument();
    expect(screen.queryByText("No hay tareas")).not.toBeInTheDocument();
    expect(screen.getByText(/todavía no hay eventos/i)).toBeInTheDocument();
  });

  it("defaults unparseable dia to today", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    await renderPage({ dia: "nope" });

    const todayLink = screen.getByRole("link", { name: /dom\s*20/i });
    expect(todayLink).toHaveAttribute("aria-current", "date");
  });

  it("asks unauthenticated users to sign in", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ user: null }));

    await renderPage();

    expect(screen.getByText(/Iniciá sesión/i)).toBeInTheDocument();
  });

  it("lists Luma calendar events for the selected day with external href", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ events: [] }));
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      events: [
        {
          id: "luma:evt-1",
          title: "La fija de los jueves: pysap",
          inicio: "2026-09-20T21:00:00.000Z",
          fin: "2026-09-20T22:00:00.000Z",
          place: "San Martín 864, Tandil",
          href: "https://luma.com/iajzrmdr",
          source: "luma" as const,
        },
      ],
    });

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("La fija de los jueves: pysap")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /La fija de los jueves/i });
    expect(link).toHaveAttribute("href", "https://luma.com/iajzrmdr");
  });

  it("degrades when Luma fails and still shows internal events", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A] }),
    );
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: "Luma calendar request failed (500)",
    });

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(
      screen.getByText(/No se pudieron cargar los eventos públicos de Luma/i),
    ).toBeInTheDocument();
  });
});
