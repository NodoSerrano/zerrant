import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgendaPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
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
function createEventsChain(events: unknown[]) {
  const resolveData = { data: events, error: null };
  const chain: Record<string, unknown> & { then: (cb: (v: unknown) => void) => unknown } = {
    then: (cb: (v: unknown) => void) => cb(resolveData),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
  };
  return chain;
}

function mockSupabase(overrides: { events?: unknown[]; user?: unknown } = {}) {
  const { events = [], user = { id: "user-1" } } = overrides;
  let eventsChain: ReturnType<typeof createEventsChain> | null = null;

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "events") {
        eventsChain = createEventsChain(events);
        return eventsChain;
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

describe("AgendaPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20, 12, 0, 0));
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

  it("lists events for the selected day from the events table", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSupabase({
        events: [
          {
            id: "evt-1",
            titulo: "Asamblea",
            descripcion: null,
            lugar: "Salón",
            inicio: "2026-09-20T18:00:00-03:00",
            fin: "2026-09-20T20:00:00-03:00",
            creado_por: "user-1",
          },
        ],
      }),
    );

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(screen.getByText("Salón")).toBeInTheDocument();
  });

  it("queries events with an inicio range for the selected day", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = mockSupabase();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);

    await renderPage({ dia: "2026-09-21" });

    const chain = client.getEventsChain();
    expect(chain).toBeTruthy();
    expect(chain!.gte).toHaveBeenCalled();
    expect(chain!.lt).toHaveBeenCalled();

    const gteArgs = (chain!.gte as ReturnType<typeof vi.fn>).mock.calls[0];
    const ltArgs = (chain!.lt as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(gteArgs[0]).toBe("inicio");
    expect(ltArgs[0]).toBe("inicio");

    const start = new Date(gteArgs[1] as string);
    const end = new Date(ltArgs[1] as string);
    expect(start.getDate()).toBe(21);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(22);
    expect(end.getHours()).toBe(0);
  });

  it("renders the agenda empty state copy, not the tasks empty copy", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ events: [] }));

    await renderPage({ dia: "2026-09-20" });

    expect(screen.getByText("No hay eventos")).toBeInTheDocument();
    expect(screen.queryByText("No hay tareas")).not.toBeInTheDocument();
    expect(
      screen.getByText(/todavía no hay eventos/i),
    ).toBeInTheDocument();
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
});
