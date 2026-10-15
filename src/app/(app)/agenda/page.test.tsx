import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgendaPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/events/luma-client", () => ({
  fetchLumaCalendarEvents: vi.fn(),
}));

vi.mock("@/features/membership/ser-serrano-cta-server", () => ({
  resolveSerSerranoCtaVisibility: vi.fn().mockResolvedValue(false),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    target,
    rel,
    "aria-current": ariaCurrent,
    "aria-label": ariaLabel,
    ...rest
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    target?: string;
    rel?: string;
    "aria-current"?: boolean | "true" | "false" | "date" | "time" | "location" | "page" | "step";
    "aria-label"?: string;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      {...rest}
    >
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
  const eventsChains: ReturnType<typeof createEventsChain>[] = [];

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "events") {
        const chain = createEventsChain(events);
        eventsChains.push(chain);
        return chain;
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
    /** First events query is the selected-day list; second is the strip window. */
    getEventsChain: () => eventsChains[0] ?? null,
    getEventsChains: () => eventsChains,
  };
}

async function renderPage(_searchParams: Record<string, string | undefined> = {}) {
  const element = await AgendaPage();
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

  it("renders the Agenda header without a day strip", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    await renderPage();

    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /dom\s*20/i })).not.toBeInTheDocument();
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

  it("shows Ser Serrano CTA for tourists without an active request (ZER-171)", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { resolveSerSerranoCtaVisibility } =
      await import("@/features/membership/ser-serrano-cta-server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ profileTier: "tourist" }),
    );
    (resolveSerSerranoCtaVisibility as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

    await renderPage();

    expect(screen.getByRole("link", { name: /Solicitar ser Serrano/i })).toHaveAttribute(
      "href",
      "/solicitar",
    );
  });

  it("hides Ser Serrano CTA for members (ZER-171)", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { resolveSerSerranoCtaVisibility } =
      await import("@/features/membership/ser-serrano-cta-server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ profileTier: "standard" }),
    );
    (resolveSerSerranoCtaVisibility as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    await renderPage();

    expect(screen.queryByRole("link", { name: /Solicitar ser Serrano/i })).not.toBeInTheDocument();
  });

  it("lists events for the selected day from the events table", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A] }),
    );

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText(/Salón/)).toBeInTheDocument();
  });

  it("lists every event, not only the selected day, with the date on the card", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A, EVENT_B] }),
    );

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("Cena comunitaria")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getAllByText("sept").length).toBeGreaterThan(0);
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

  it("loads events ordered by start, without a day window", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = mockSupabase();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await renderPage({ dia: "2026-09-21" });

    const chain = client.getEventsChain();
    expect(chain).toBeTruthy();
    expect(chain!.order).toHaveBeenCalledWith("inicio", { ascending: true });
    expect(chain!.gte).not.toHaveBeenCalled();
    expect(chain!.lt).not.toHaveBeenCalled();
  });

  it("renders the agenda empty state copy, not the tasks empty copy", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ events: [] }));

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("No hay eventos")).toBeInTheDocument();
    expect(screen.queryByText("No hay tareas")).not.toBeInTheDocument();
    expect(screen.getByText(/todavía no hay eventos/i)).toBeInTheDocument();
  });

  it("ignores the dia query and still shows the list", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A, EVENT_B] }),
    );

    await renderPage({ dia: "nope" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("Cena comunitaria")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nuevo evento/i })).toBeInTheDocument();
  });

  it("asks unauthenticated users to sign in", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ user: null }));

    await renderPage();

    expect(screen.getByText(/Iniciá sesión/i)).toBeInTheDocument();
  });

  it("lists Luma events even when they fall on another day", async () => {
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
          coverUrl: null,
        },
      ],
    });

    await renderPage({ dia: "2026-09-21" });

    expect(screen.getByText("La fija de los jueves: pysap")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /La fija de los jueves/i });
    expect(link).toHaveAttribute("href", "https://luma.com/iajzrmdr");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lists internal and Luma events together without a day filter", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({ events: [EVENT_A] }),
    );
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      events: [
        {
          id: "luma:evt-1",
          title: "La fija de los jueves: pysap",
          inicio: "2026-09-24T21:00:00.000Z",
          fin: "2026-09-24T22:00:00.000Z",
          place: "San Martín 864, Tandil",
          href: "https://luma.com/iajzrmdr",
          source: "luma" as const,
          coverUrl: null,
        },
      ],
    });

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("La fija de los jueves: pysap")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
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
