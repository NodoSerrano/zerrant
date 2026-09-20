import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InicioPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
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

type ProfileRow = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  apodo: string | null;
  nombre_visible: "nombre_apellido" | "apodo";
  fecha_nacimiento: string | null;
  avatar_url: string | null;
  tier: string;
};

function mockSupabase(
  opts: {
    user?: { id: string } | null;
    events?: EventRow[];
    profiles?: ProfileRow[];
  } = {},
) {
  const { user = { id: "user-1" }, events = [], profiles = [] } = opts;

  const eventsChain: Record<string, unknown> & {
    then: (cb: (v: unknown) => void) => unknown;
  } = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (cb: (v: unknown) => void) => cb({ data: events, error: null }),
  };

  const profilesChain: Record<string, unknown> & {
    then: (cb: (v: unknown) => void) => unknown;
  } = {
    select: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    then: (cb: (v: unknown) => void) => cb({ data: profiles, error: null }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "events") return eventsChain;
      if (table === "profiles") return profilesChain;
      return eventsChain;
    }),
    eventsChain,
    profilesChain,
  };
}

describe("InicioPage (/)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T15:00:00-03:00"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase({ user: null }));
    await expect(InicioPage()).rejects.toThrow("REDIRECT:/auth/login");
  });

  it("renders Inicio hub instead of bouncing to /profile when onboarded", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    const element = await InicioPage();
    render(element);
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument();
  });

  it("lists upcoming events from the events table", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = mockSupabase({
      events: [
        {
          id: "evt-a",
          titulo: "Asamblea",
          descripcion: null,
          lugar: "Salón",
          inicio: "2026-09-20T18:00:00-03:00",
          fin: "2026-09-20T20:00:00-03:00",
          creado_por: "user-1",
        },
      ],
    });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
    render(await InicioPage());
    expect(screen.getByText("Asamblea")).toBeInTheDocument();
    expect(client.from).toHaveBeenCalledWith("events");
    expect(client.eventsChain.gte).toHaveBeenCalled();
  });

  it("lists plantel-class birthdays only (neq tourist query) via helpers", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = mockSupabase({
      profiles: [
        {
          id: "p-ok",
          nombre: "Ana",
          apellido: "García",
          apodo: null,
          nombre_visible: "nombre_apellido",
          fecha_nacimiento: "1990-09-25",
          avatar_url: null,
          tier: "standard",
        },
        {
          id: "p-far",
          nombre: "Lejos",
          apellido: "X",
          apodo: null,
          nombre_visible: "nombre_apellido",
          fecha_nacimiento: "1990-01-01",
          avatar_url: null,
          tier: "standard",
        },
      ],
    });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(client);
    render(await InicioPage());
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.queryByText("Lejos X")).not.toBeInTheDocument();
    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(client.profilesChain.neq).toHaveBeenCalledWith("tier", "tourist");
  });

  it("shows honest empty sections when there are no rows", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    render(await InicioPage());
    expect(screen.getByText("No hay eventos próximos")).toBeInTheDocument();
    expect(screen.getByText("No hay cumpleaños próximos")).toBeInTheDocument();
  });
});
