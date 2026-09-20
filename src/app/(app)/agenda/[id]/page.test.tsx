import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  eventsSelect: vi.fn(),
  eventsEq: vi.fn(),
  eventsMaybeSingle: vi.fn(),
  attendanceSelect: vi.fn(),
  attendanceEq: vi.fn(),
  profilesSelect: vi.fn(),
  profilesIn: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    mocks.notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    "aria-label": ariaLabel,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import EventDetailPage from "./page";

const EVENT_ID = "evt-1";

const EVENT_ROW = {
  id: EVENT_ID,
  titulo: "Asamblea de domingo",
  descripcion: "Reunión de coordinación del nodo.",
  lugar: "Salón principal",
  inicio: "2026-09-20T18:00:00-03:00",
  fin: "2026-09-20T20:00:00-03:00",
  creado_por: "creator-1",
};

const CREATOR_PROFILE = {
  id: "creator-1",
  nombre: "Lucía",
  apellido: "Gómez",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
};

const VALEN = {
  id: "a1",
  nombre: "Valen",
  apellido: "Ruiz",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
};

const QUIMEY = {
  id: "a2",
  nombre: "Quimey",
  apellido: "Soto",
  apodo: null,
  nombre_visible: "nombre_apellido",
  avatar_url: null,
};

function wireFrom(
  options: {
    event?: typeof EVENT_ROW | null;
    attendance?: Array<{ profile_id: string; estado: string }>;
    profiles?: Array<typeof CREATOR_PROFILE>;
  } = {},
) {
  const {
    event = EVENT_ROW,
    attendance = [
      { profile_id: "a1", estado: "voy" },
      { profile_id: "a2", estado: "quizas" },
    ],
    profiles = [CREATOR_PROFILE, VALEN, QUIMEY],
  } = options;

  mocks.eventsMaybeSingle.mockResolvedValue({ data: event, error: null });
  mocks.attendanceEq.mockResolvedValue({ data: attendance, error: null });
  mocks.profilesIn.mockResolvedValue({ data: profiles, error: null });

  mocks.from.mockImplementation((table: string) => {
    if (table === "events") {
      return {
        select: mocks.eventsSelect.mockReturnValue({
          eq: mocks.eventsEq.mockReturnValue({
            maybeSingle: mocks.eventsMaybeSingle,
          }),
        }),
      };
    }
    if (table === "event_attendance") {
      return {
        select: mocks.attendanceSelect.mockReturnValue({
          eq: mocks.attendanceEq,
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: mocks.profilesSelect.mockReturnValue({
          in: mocks.profilesIn,
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

async function renderPage(id = EVENT_ID) {
  const element = await EventDetailPage({ params: Promise.resolve({ id }) });
  return render(element);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "viewer-1" } }, error: null });
  wireFrom();
});

describe("EventDetailPage", () => {
  it("asks unauthenticated users to sign in", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await renderPage();
    expect(screen.getByText(/Iniciá sesión/i)).toBeInTheDocument();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("calls notFound when the event is missing", async () => {
    wireFrom({ event: null });
    await expect(renderPage("missing")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it("renders event fields, creator and grouped attendees from real rows", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: "Asamblea de domingo" })).toBeInTheDocument();
    expect(screen.getByText("Reunión de coordinación del nodo.")).toBeInTheDocument();
    expect(screen.getByText("Salón principal")).toBeInTheDocument();
    expect(screen.getByText("18:00 – 20:00")).toBeInTheDocument();
    expect(screen.getByText(/Creado por Lucía Gómez/)).toBeInTheDocument();
    expect(screen.getByText("Voy")).toBeInTheDocument();
    expect(screen.getByText("Quizás")).toBeInTheDocument();
    expect(screen.getByText("Valen Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Quimey Soto")).toBeInTheDocument();
  });

  it("shows the empty attendee state when there are no RSVP rows", async () => {
    wireFrom({ attendance: [], profiles: [CREATOR_PROFILE] });
    await renderPage();

    expect(screen.getByText("Nadie confirmó todavía")).toBeInTheDocument();
    expect(screen.queryByText("Voy")).not.toBeInTheDocument();
    expect(screen.queryByText("Quizás")).not.toBeInTheDocument();
  });

  it("reads events and attendance without gating tourists", async () => {
    await renderPage();

    expect(mocks.from).toHaveBeenCalledWith("events");
    expect(mocks.from).toHaveBeenCalledWith("event_attendance");
    expect(mocks.from).not.toHaveBeenCalledWith("is_non_tourist");
    expect(mocks.eventsSelect).toHaveBeenCalledWith(
      "id, titulo, descripcion, lugar, inicio, fin, creado_por",
    );
    expect(mocks.eventsEq).toHaveBeenCalledWith("id", EVENT_ID);
    expect(mocks.attendanceSelect).toHaveBeenCalledWith("profile_id, estado");
    expect(mocks.attendanceEq).toHaveBeenCalledWith("event_id", EVENT_ID);
  });

  it("loads profiles with an explicit column list and no tarifa_hora", async () => {
    await renderPage();

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    const selected = String(mocks.profilesSelect.mock.calls[0]?.[0] ?? "");
    expect(selected).toContain("id");
    expect(selected).toContain("nombre");
    expect(selected).toContain("apellido");
    expect(selected).toContain("apodo");
    expect(selected).toContain("nombre_visible");
    expect(selected).toContain("avatar_url");
    expect(selected).not.toContain("*");
    expect(selected).not.toContain("tarifa_hora");

    const ids = mocks.profilesIn.mock.calls[0]?.[1] as string[];
    expect(mocks.profilesIn.mock.calls[0]?.[0]).toBe("id");
    expect(ids).toEqual(expect.arrayContaining(["creator-1", "a1", "a2"]));
  });
});
