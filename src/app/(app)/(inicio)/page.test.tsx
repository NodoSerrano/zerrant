import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InicioPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/features/events/luma-client", () => ({
  fetchLumaCalendarEvents: vi.fn(),
}));

vi.mock("@/features/profile/onboarding-gate-server", () => ({
  getOnboardingGateProfile: vi.fn(),
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
    events?: EventRow[];
    profiles?: ProfileRow[];
  } = {},
) {
  const { events = [], profiles = [] } = opts;

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
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
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

const completeProfile = {
  nombre: "Juan",
  apellido: "Pérez",
  fecha_nacimiento: "1990-01-15",
  onboarding_completado_en: "2026-01-01T00:00:00Z",
  tier: "standard",
};

describe("InicioPage (/)", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T15:00:00-03:00"));
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      events: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: null,
      error: null,
      userId: null,
    });

    await expect(InicioPage()).rejects.toThrow("REDIRECT:/auth/login");
  });

  it("redirects incomplete onboarding away from Inicio (AC2 / NFR27)", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: {
        nombre: "Juan",
        apellido: "Pérez",
        fecha_nacimiento: "1990-01-15",
        onboarding_completado_en: null,
      },
      error: null,
      userId: "user-1",
    });

    await expect(InicioPage()).rejects.toThrow("REDIRECT:/onboarding/step2");
  });

  it("redirects missing step1 data to step1", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: {
        nombre: null,
        apellido: null,
        fecha_nacimiento: null,
        onboarding_completado_en: null,
      },
      error: null,
      userId: "user-1",
    });

    await expect(InicioPage()).rejects.toThrow("REDIRECT:/onboarding/step1");
  });

  it("renders Inicio hub instead of bouncing to /profile when onboarded", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    const { createClient } = await import("@/lib/supabase/server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: completeProfile,
      error: null,
      userId: "user-1",
    });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    const element = await InicioPage();
    render(element);
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument();
  });

  it("lists upcoming events from the events table", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    const { createClient } = await import("@/lib/supabase/server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: completeProfile,
      error: null,
      userId: "user-1",
    });
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
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    const { createClient } = await import("@/lib/supabase/server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: completeProfile,
      error: null,
      userId: "user-1",
    });
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
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    const { createClient } = await import("@/lib/supabase/server");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: completeProfile,
      error: null,
      userId: "user-1",
    });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());

    render(await InicioPage());
    expect(screen.getByText("No hay eventos próximos")).toBeInTheDocument();
    expect(screen.getByText("No hay cumpleaños próximos")).toBeInTheDocument();
  });

  it("lists Luma events on Inicio with external href", async () => {
    const { getOnboardingGateProfile } = await import("@/features/profile/onboarding-gate-server");
    const { createClient } = await import("@/lib/supabase/server");
    const { fetchLumaCalendarEvents } = await import("@/features/events/luma-client");
    (getOnboardingGateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: completeProfile,
      error: null,
      userId: "user-1",
    });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase());
    (fetchLumaCalendarEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      events: [
        {
          id: "luma:evt-1",
          title: "Meetup Luma",
          inicio: "2026-09-24T21:00:00.000Z",
          fin: null,
          place: "Hub",
          href: "https://luma.com/abc",
          source: "luma" as const,
        },
      ],
    });

    render(await InicioPage());
    expect(screen.getByText("Meetup Luma")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Meetup Luma/i })).toHaveAttribute(
      "href",
      "https://luma.com/abc",
    );
  });
});
