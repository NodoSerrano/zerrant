import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  taskSingle: vi.fn(),
  profileSingle: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: table === "tasks" ? mocks.taskSingle : mocks.profileSingle,
        })),
      })),
    })),
  }),
}));

// redirect() y notFound() cortan la ejecución lanzando. Se replica para que el
// server component no siga renderizando después, igual que en producción.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
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

import TaskDetailPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

// `nombre_visible` es la preferencia de cómo mostrar el nombre, no el nombre.
const CREATOR = {
  id: "creator-1",
  nombre: "Lucía",
  apellido: "Gómez",
  apodo: null,
  nombre_visible: "nombre_apellido",
};
const TAKER = {
  id: "taker-1",
  nombre: "Juan",
  apellido: "Pérez",
  apodo: null,
  nombre_visible: "nombre_apellido",
};

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    titulo: "Reparar el caño del baño",
    descripcion: "El caño de abajo de la pileta pierde agua.",
    categoria: "reparacion",
    urgencia: "alta",
    estado: "abierta",
    creado_por: CREATOR.id,
    tomada_por: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    creador: CREATOR,
    tomador: null,
    ...overrides,
  };
}

/** viewer: quién mira. tier/admin definen qué acciones le corresponden. */
async function renderDetail({
  task = makeTask(),
  viewerId = "someone-else",
  tier = "standard",
  isAdmin = false,
}: {
  task?: Record<string, unknown> | null;
  viewerId?: string | null;
  tier?: string;
  isAdmin?: boolean;
} = {}) {
  mocks.getUser.mockResolvedValue({ data: { user: viewerId ? { id: viewerId } : null } });
  mocks.taskSingle.mockResolvedValue({ data: task, error: null });
  mocks.profileSingle.mockResolvedValue({
    data: { id: viewerId, tier, is_platform_admin: isAdmin },
    error: null,
  });

  const element = await TaskDetailPage({ params: Promise.resolve({ id: "task-1" }) });
  return render(element);
}

describe("TaskDetailPage — guards preserved", () => {
  it("redirects an unauthenticated visitor to /auth/login", async () => {
    await expect(renderDetail({ viewerId: null })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("returns notFound when the task does not exist", async () => {
    await expect(renderDetail({ task: null })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("TaskDetailPage — header row (AC1)", () => {
  it("shows the back chevron linking to the hub", async () => {
    const { container } = await renderDetail();

    const back = container.querySelector('a[href="/nodo/tasks"]');
    expect(back).toBeTruthy();
    expect(back!.querySelector("svg")?.getAttribute("class")).toContain("lucide-chevron-left");
  });

  it("renders no inline svg — every icon comes from lucide", async () => {
    const { container } = await renderDetail();

    const svgs = Array.from(container.querySelectorAll("svg"));
    expect(svgs.length).toBeGreaterThan(0);
    expect(svgs.every((s) => s.getAttribute("class")?.includes("lucide"))).toBe(true);
  });

  it("titles the screen 'Tarea' with the Pencil type styles", async () => {
    await renderDetail();

    const title = screen.getByText("Tarea");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-base");
    expect(title.className).toContain("font-medium");
    expect(title.className).toContain("text-text-primary");
  });

  it("lays the header out as a space-between row", async () => {
    await renderDetail();

    const header = screen.getByText("Tarea").parentElement!;
    expect(header.className).toContain("justify-between");
    expect(header.className).toContain("items-center");
  });
});

describe("TaskDetailPage — title block (AC2)", () => {
  it("renders the category icon in a 48px rounded container", async () => {
    const { container } = await renderDetail();

    const icon = container.querySelector("svg.lucide-wrench")!;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute("class")).toContain("text-warm-orange");
    expect(icon.parentElement!.className).toContain("size-12");
    expect(icon.parentElement!.className).toContain("rounded-[14px]");
    expect(icon.parentElement!.className).toContain("bg-warm-yellow/[0.09]");
  });

  it("picks the icon from the categoria", async () => {
    const { container } = await renderDetail({ task: makeTask({ categoria: "compra" }) });

    expect(container.querySelector("svg.lucide-shopping-cart")).toBeTruthy();
  });

  it("renders the task title at 20px bold display", async () => {
    await renderDetail();

    const title = screen.getByText("Reparar el caño del baño");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-xl");
    expect(title.className).toContain("font-bold");
  });
});

describe("TaskDetailPage — estado badge (AC3)", () => {
  it.each([
    ["abierta", "Abierta", "bg-blue-raw/20", "text-brand-blue"],
    ["tomada", "Tomada", "bg-coral/20", "text-coral"],
    ["hecha", "Hecha", "bg-mint-raw/20", "text-brand-mint"],
    ["verificada", "Verificada", "bg-brand-green/20", "text-brand-green"],
    ["cancelada", "Cancelada", "bg-surface-inset", "text-text-muted"],
  ])("renders the %s badge", async (estado, label, bg, text) => {
    await renderDetail({ task: makeTask({ estado }) });

    const badge = screen.getByText(label);
    expect(badge.className).toContain("rounded-pill");
    expect(badge.className).toContain(bg);
    expect(badge.className).toContain(text);
  });
});

describe("TaskDetailPage — meta card (AC4)", () => {
  it("wraps the three rows in a bordered surface card", async () => {
    await renderDetail();

    const card = screen.getByText("Reparación").closest("div")!.parentElement!;
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-border");
    expect(card.className).toContain("rounded-md");
    expect(card.className).toContain("p-4");
    expect(card.className).toContain("gap-[10px]");
  });

  it("shows the category in Spanish, not the raw enum", async () => {
    await renderDetail();

    expect(screen.getByText("Reparación")).toBeInTheDocument();
    expect(screen.queryByText("reparacion")).not.toBeInTheDocument();
  });

  it.each([
    ["alta", "Urgencia alta", "text-warm-orange"],
    ["media", "Urgencia media", "text-warm-yellow"],
    ["baja", "Urgencia baja", "text-text-muted"],
  ])("shows %s urgency with its colour", async (urgencia, label, color) => {
    const { container } = await renderDetail({ task: makeTask({ urgencia }) });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-flame")!.getAttribute("class")).toContain(color);
  });

  // relativeTime ya existe y está testeado en src/lib/time.ts. La pantalla vieja
  // usaba toLocaleDateString, que no es lo que pide el frame.
  it("shows who published it and how long ago, in relative time", async () => {
    await renderDetail();

    expect(screen.getByText("Publicó Lucía Gómez · hace 2 días")).toBeInTheDocument();
  });

  it("omits the author row when the creator profile is missing", async () => {
    await renderDetail({ task: makeTask({ creador: null }) });

    expect(screen.queryByText(/Publicó/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it("drops the invented section headings the placeholder had", async () => {
    await renderDetail();

    expect(screen.queryByText("Información")).not.toBeInTheDocument();
    expect(screen.queryByText("Creada por")).not.toBeInTheDocument();
  });
});

describe("TaskDetailPage — description (AC5)", () => {
  it("renders the description with the Pencil body styles and no heading", async () => {
    await renderDetail();

    const body = screen.getByText("El caño de abajo de la pileta pierde agua.");
    expect(body.className).toContain("font-body");
    expect(body.className).toContain("text-sm");
    expect(body.className).toContain("leading-[21px]");
    expect(body.className).toContain("text-text-secondary");
  });

  // createTask persiste el textarea vacío como "" y nunca como null, así que la
  // guarda tiene que tratar los dos casos igual.
  it.each([[null], [""], ["   "]])("omits the description when it is %p", async (descripcion) => {
    const { container } = await renderDetail({ task: makeTask({ descripcion }) });

    const paragraphs = Array.from(container.querySelectorAll("p"));
    expect(paragraphs.some((p) => p.className.includes("leading-[21px]"))).toBe(false);
  });
});

describe("TaskDetailPage — primary action (AC5)", () => {
  it("offers 'Tomar esta tarea' to a serrano who is not the creator", async () => {
    await renderDetail({ viewerId: TAKER.id, tier: "standard" });

    expect(screen.getByRole("button", { name: "Tomar esta tarea" })).toBeInTheDocument();
  });

  it("does not offer to take it to a tourist", async () => {
    await renderDetail({ viewerId: TAKER.id, tier: "tourist" });

    expect(screen.queryByRole("button", { name: /Tomar/ })).not.toBeInTheDocument();
  });

  it("does not offer the creator to take their own task", async () => {
    await renderDetail({ viewerId: CREATOR.id, tier: "standard" });

    expect(screen.queryByRole("button", { name: /Tomar/ })).not.toBeInTheDocument();
  });

  it("offers 'Marcar como hecha' to the person who took it", async () => {
    await renderDetail({
      task: makeTask({ estado: "tomada", tomada_por: TAKER.id, tomador: TAKER }),
      viewerId: TAKER.id,
    });

    expect(screen.getByRole("button", { name: "Marcar como hecha" })).toBeInTheDocument();
  });

  it("tells everyone else that the task is already taken", async () => {
    await renderDetail({
      task: makeTask({ estado: "tomada", tomada_por: TAKER.id, tomador: TAKER }),
      viewerId: "third-party",
    });

    expect(screen.getByText("Esta tarea ya fue tomada por otro serrano.")).toBeInTheDocument();
  });

  it("offers 'Verificar tarea' to a platform admin on a done task", async () => {
    await renderDetail({
      task: makeTask({ estado: "hecha", tomada_por: TAKER.id, tomador: TAKER }),
      viewerId: "admin-1",
      isAdmin: true,
    });

    expect(screen.getByRole("button", { name: "Verificar tarea" })).toBeInTheDocument();
  });

  it("does not offer verification to a non-admin", async () => {
    await renderDetail({
      task: makeTask({ estado: "hecha", tomada_por: TAKER.id, tomador: TAKER }),
      viewerId: "regular-1",
    });

    expect(screen.queryByRole("button", { name: /Verificar/ })).not.toBeInTheDocument();
  });

  it("states the outcome on a verified task, without the tick glyph", async () => {
    await renderDetail({ task: makeTask({ estado: "verificada" }) });

    expect(screen.getByText("Tarea verificada y completada.")).toBeInTheDocument();
    expect(screen.queryByText(/✔/)).not.toBeInTheDocument();
  });

  it("states the outcome on a cancelled task", async () => {
    await renderDetail({ task: makeTask({ estado: "cancelada" }) });

    expect(screen.getByText("Esta tarea fue cancelada.")).toBeInTheDocument();
  });
});

describe("TaskDetailPage — header menu (AC6)", () => {
  it("offers the menu to the creator while the task is still open", async () => {
    await renderDetail({ viewerId: CREATOR.id });

    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });

  it("does not offer it to anyone else", async () => {
    await renderDetail({ viewerId: TAKER.id });

    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });

  it("does not offer it once the task is done", async () => {
    await renderDetail({ task: makeTask({ estado: "hecha" }), viewerId: CREATOR.id });

    expect(screen.queryByRole("button", { name: "Más opciones" })).not.toBeInTheDocument();
  });

  // Sin menú el header quedaría descentrado, porque el chevron de la izquierda
  // no tendría contrapeso.
  it("keeps a spacer so the title stays centred when there is no menu", async () => {
    await renderDetail({ viewerId: TAKER.id });

    const header = screen.getByText("Tarea").parentElement!;
    expect(header.children).toHaveLength(3);
  });
});

describe("TaskDetailPage — layout structure (AC1, AC5)", () => {
  it("spaces the wrapper at the 18px Pencil rhythm", async () => {
    const { container } = await renderDetail();

    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("flex-col");
    expect(wrapper.className).toContain("gap-[18px]");
  });

  // El CTA cuelga del wrapper en Pencil, no de un contenedor intermedio. Metido
  // adentro de otro flex hereda el gap de ese padre y la separación queda mal
  // sin que ningún test de clases lo note — es el bug que ZER-21 tuvo que
  // descoser.
  it("hangs the CTA off the wrapper, not off a nested container", async () => {
    const { container } = await renderDetail({ viewerId: TAKER.id, tier: "standard" });

    const wrapper = container.firstElementChild!;
    const cta = screen.getByRole("button", { name: "Tomar esta tarea" });
    const ctaBlock = cta.closest("form") ?? cta;

    expect(ctaBlock.parentElement).toBe(wrapper);
  });
});
