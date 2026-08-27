import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  taskSingle: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mocks.taskSingle })),
      })),
    })),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mocks.redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    mocks.notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import EditTaskPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

const OWNER = "creator-1";

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    titulo: "Reparar el caño del baño",
    descripcion: "Pierde agua abajo de la pileta.",
    categoria: "limpieza",
    urgencia: "baja",
    estado: "abierta",
    creado_por: OWNER,
    tomada_por: null,
    created_at: "2026-07-26T12:00:00Z",
    ...overrides,
  };
}

async function renderEdit({
  task = makeTask(),
  viewerId = OWNER,
}: { task?: Record<string, unknown> | null; viewerId?: string | null } = {}) {
  mocks.getUser.mockResolvedValue({ data: { user: viewerId ? { id: viewerId } : null } });
  mocks.taskSingle.mockResolvedValue({ data: task, error: null });

  const element = await EditTaskPage({ params: Promise.resolve({ id: "task-1" }) });
  return render(element);
}

describe("EditTaskPage — authorization (AC8)", () => {
  it("redirects an unauthenticated visitor to /auth/login", async () => {
    await expect(renderEdit({ viewerId: null })).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("returns notFound when the task does not exist", async () => {
    await expect(renderEdit({ task: null })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // Defense in depth: the redirect is UX, so we don't show a form that
  // can't be submitted. The real guard lives in `updateTask`, because a
  // direct POST skips the render.
  it("sends anyone who is not the creator back to the detail screen", async () => {
    await expect(renderEdit({ viewerId: "someone-else" })).rejects.toThrow(
      "NEXT_REDIRECT:/nodo/tasks/task-1",
    );
  });

  it("lets the creator through", async () => {
    await renderEdit();

    expect(screen.getByText("Editar tarea")).toBeInTheDocument();
  });
});

describe("EditTaskPage — header, frame H3BY0u (AC8)", () => {
  // The frame uses chevron-left, not the `x` from create task: editing is
  // backward navigation, not the closing of a modal.
  it("exits through a back chevron pointing at the detail screen", async () => {
    const { container } = await renderEdit();

    const back = container.querySelector('a[href="/nodo/tasks/task-1"]')!;
    expect(back).toBeTruthy();
    expect(back.querySelector("svg")?.getAttribute("class")).toContain("lucide-chevron-left");
  });

  it("stretches the wrapper to the full width", async () => {
    const { container } = await renderEdit();

    expect(container.firstElementChild!.className).toContain("w-full");
  });

  it("titles the screen 'Editar tarea' with the Pencil type styles", async () => {
    await renderEdit();

    const title = screen.getByText("Editar tarea");
    expect(title.className).toContain("font-display");
    expect(title.className).toContain("text-base");
    expect(title.className).toContain("font-medium");
  });

  it("offers the menu, since the viewer here is always the creator", async () => {
    await renderEdit();

    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });
});

describe("EditTaskPage — prefilled form (AC8)", () => {
  it("prefills the title", async () => {
    await renderEdit();

    expect(screen.getByLabelText(/Título/)).toHaveValue("Reparar el caño del baño");
  });

  it("prefills the description", async () => {
    await renderEdit();

    expect(screen.getByLabelText("Descripción")).toHaveValue("Pierde agua abajo de la pileta.");
  });

  it("preselects the saved categoria, not the create-screen default", async () => {
    const { container } = await renderEdit();

    expect(container.querySelector('input[name="categoria"][value="limpieza"]')).toBeChecked();
    expect(
      container.querySelector('input[name="categoria"][value="reparacion"]'),
    ).not.toBeChecked();
  });

  it("preselects the saved urgencia, not the create-screen default", async () => {
    const { container } = await renderEdit();

    expect(container.querySelector('input[name="urgencia"][value="baja"]')).toBeChecked();
    expect(container.querySelector('input[name="urgencia"][value="media"]')).not.toBeChecked();
  });

  it("renders an empty description without printing null", async () => {
    await renderEdit({ task: makeTask({ descripcion: null }) });

    expect(screen.getByLabelText("Descripción")).toHaveValue("");
  });

  // `updateTask` needs to know which row to update, and the form has to
  // work without JavaScript.
  it("carries the task id in the form", async () => {
    const { container } = await renderEdit();

    expect(container.querySelector('input[name="taskId"]')).toHaveValue("task-1");
  });
});

describe("EditTaskPage — estado guard (AC8)", () => {
  // Edit only while nobody has committed to the task. The route is guessable
  // and the back button lands here after cancelling from the screen itself.
  it.each(["tomada", "hecha", "verificada", "cancelada"])(
    "sends the creator back to the detail screen when the task is %s",
    async (estado) => {
      await expect(renderEdit({ task: makeTask({ estado }) })).rejects.toThrow(
        "NEXT_REDIRECT:/nodo/tasks/task-1",
      );
    },
  );
});

describe("EditTaskPage — CTA (AC8)", () => {
  it("labels the submit button 'Guardar cambios'", async () => {
    await renderEdit();

    const cta = screen.getByRole("button", { name: "Guardar cambios" });
    expect(cta).toHaveAttribute("type", "submit");
    expect(cta.className).toContain("w-full");
  });

  it("has no Cancelar button — the frame exits through the chevron", async () => {
    await renderEdit();

    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  // Same bug ZER-21 had to unpick: in Pencil the CTA hangs off the wrapper
  // with gap 18, not off the field group which has gap 16.
  it("separates the CTA from the fields by 18px, not 16px", async () => {
    await renderEdit();

    const cta = screen.getByRole("button", { name: "Guardar cambios" });
    const form = cta.closest("form")!;
    expect(cta.parentElement).toBe(form);
    expect(form.className).toContain("gap-[18px]");

    const fields = form.querySelector("div.flex.flex-col")!;
    expect(fields.className).toContain("gap-4");
  });
});
